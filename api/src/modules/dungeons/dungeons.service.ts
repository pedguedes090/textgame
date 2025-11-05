import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Dungeon } from 'src/entities/dungeon.entity';
import { DropTable } from 'src/entities/drop-table.entity';
import { UserCreature } from 'src/entities/user-creature.entity';
import { Battle } from 'src/entities/battle.entity';
import { UserInventory } from 'src/entities/user-inventory.entity';
import { User } from 'src/entities/user.entity';
import { BattleService } from 'src/common/services/battle.service';
import { LootService } from 'src/common/services/loot.service';
import { RngService } from 'src/common/services/rng.service';
import { LockService } from 'src/common/services/lock.service';
import { QuestProgressService } from 'src/common/services/quest-progress.service';
import { CreatureProgressionService } from 'src/common/services/creature-progression.service';
import { StaminaService } from 'src/common/services/stamina.service';
import { RunDungeonDto } from './dto/run-dungeon.dto';

@Injectable()
export class DungeonsService {
  constructor(
    @InjectRepository(Dungeon)
    private readonly dungeonRepo: Repository<Dungeon>,
    @InjectRepository(DropTable)
    private readonly dropTableRepo: Repository<DropTable>,
    @InjectRepository(UserCreature)
    private readonly creatureRepo: Repository<UserCreature>,
    @InjectRepository(Battle)
    private readonly battleRepo: Repository<Battle>,
    @InjectRepository(UserInventory)
    private readonly inventoryRepo: Repository<UserInventory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly battleService: BattleService,
    private readonly lootService: LootService,
    private readonly rngService: RngService,
    private readonly lockService: LockService,
    private readonly questProgressService: QuestProgressService,
    private readonly creatureProgressionService: CreatureProgressionService,
    private readonly staminaService: StaminaService,
    private readonly dataSource: DataSource,
  ) {}

  async listDungeons() {
    return this.dungeonRepo.find({
      order: { id: 'ASC' },
    });
  }

  async runDungeon(userId: number, dto: RunDungeonDto) {
    // Acquire lock để tránh double-run
    const lockKey = `dungeon:${userId}`;
    return this.lockService.withLock(lockKey, 10000, async () => {
      // Get dungeon
      const dungeon = await this.dungeonRepo.findOne({
        where: { id: dto.dungeon_id },
      });
      if (!dungeon) {
        throw new NotFoundException('Dungeon not found');
      }

      // Get user and check stamina
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      
      // Deduct stamina using stamina service
      await this.staminaService.deductStamina(userId, dungeon.stamina_cost);

      // Get party creatures với relations
      const party = await this.creatureRepo.find({
        where: dto.party.map((id) => ({ id, user_id: userId })),
        relations: ['species'],
      });

      if (party.length !== dto.party.length) {
        throw new BadRequestException('Invalid party composition');
      }

      // Check power
      const totalPower = party.reduce((sum, c) => sum + c.power_score, 0);
      const powerRatio = totalPower / dungeon.recommended_power;

      // Parse boss
      const bossData = JSON.parse(dungeon.boss_json || '{}');
      const boss = this.battleService.parseCombatant(
        9999,
        bossData.name || 'Boss',
        bossData.base_stats || { hp: 500, atk: 80, def: 50, spd: 50 },
        {},
        bossData.level || 10,
        bossData.element || 'NEUTRAL',
        bossData.skills || [],
        false,
      );

      // Parse party combatants
      const playerTeam = party.map((c) => {
        const baseStats = JSON.parse(c.species.base_stats);
        const ivRolls = c.iv_rolls ? JSON.parse(c.iv_rolls) : {};
        const skills = c.skills ? JSON.parse(c.skills) : [];
        return this.battleService.parseCombatant(
          c.id,
          c.species.name,
          baseStats,
          ivRolls,
          c.level,
          c.species.element,
          skills,
          true,
        );
      });

      // RNG setup
      const serverSeed = this.rngService.generateServerSeed();
      const seedCommit = this.rngService.generateCommit(serverSeed);
      const clientSeed = dto.client_seed || 'default';
      const combined = this.rngService.combinedSeed(clientSeed, serverSeed);

      let nonce = 0;
      const random = () => {
        const val = this.rngService.rollFloat(combined, nonce);
        nonce++;
        return val;
      };

      // Execute battle
      const battleResult = this.battleService.executeBattle(playerTeam, [boss], random);

      // Loot
      const drops: Array<{ item_id: number; quantity: number }> = [];
      if (battleResult.victory) {
        const dropTable = await this.dropTableRepo.findOne({
          where: { id: dungeon.drop_table_id },
        });

        if (dropTable) {
          const entries = JSON.parse(dropTable.entries);
          const aliasData = dropTable.alias_data
            ? JSON.parse(dropTable.alias_data)
            : this.lootService.buildAliasTable(entries.map((e: any) => e.weight));

          // Bonus drop nếu power vượt khuyến nghị
          const dropCount = powerRatio >= 1.2 ? 2 : 1;
          drops.push(...this.lootService.rollLoot(entries, aliasData, random, dropCount));
        }
      }

      // Calculate EXP
      const expGains = battleResult.victory
        ? party.map((c) => ({ creature_id: c.id, gain: 100 + dungeon.recommended_power }))
        : [];

      // Calculate gold reward (50% of recommended power)
      const goldReward = battleResult.victory 
        ? Math.floor(dungeon.recommended_power * 0.5)
        : 0;

      // Transaction: save battle, deduct stamina, add drops, add exp, add gold
      await this.dataSource.transaction(async (manager) => {
        // Save battle
        const battle = manager.create(Battle, {
          type: 'DUNGEON',
          user_id: userId,
          seed_commit: seedCommit,
          server_seed_reveal: serverSeed,
          log: JSON.stringify(battleResult.log),
          result_json: JSON.stringify({
            victory: battleResult.victory,
            drops,
            exp_gains: expGains,
          }),
        });
        await manager.save(battle);

        // Add gold reward (stamina already deducted)
        user.gold += goldReward;
        await manager.save(user);

        // Add drops
        for (const drop of drops) {
          const existing = await manager.findOne(UserInventory, {
            where: { user_id: userId, item_id: drop.item_id, bound: false },
          });
          if (existing) {
            existing.quantity += drop.quantity;
            await manager.save(existing);
          } else {
            const inv = manager.create(UserInventory, {
              user_id: userId,
              item_id: drop.item_id,
              quantity: drop.quantity,
            });
            await manager.save(inv);
          }
        }

        // Add EXP using progression service (will be done after transaction)
      });

      // Award EXP to party creatures (after transaction to avoid conflicts)
      const expResults = await this.creatureProgressionService.awardExpToParty(
        userId,
        party.map((c: any) => c.id),
        100 + dungeon.recommended_power
      );

      // Track quest progress
      if (battleResult.victory) {
        await this.questProgressService.trackDungeon(userId, dungeon.id);
        await this.questProgressService.trackCollectGold(userId, goldReward);
        
        // Track level ups for creatures
        for (const expResult of expResults) {
          if (expResult.levels_gained > 0) {
            for (let i = 0; i < expResult.levels_gained; i++) {
              await this.questProgressService.trackLevelUpCreature(userId);
            }
          }
        }
      }

      return {
        victory: battleResult.victory,
        turns: battleResult.turns,
        log: battleResult.log.slice(0, 20), // Truncate log
        drops,
        gold_reward: goldReward,
        exp_results: expResults,
        seed_commit: seedCommit,
        server_seed_reveal: serverSeed,
      };
    });
  }

  async getDungeonDropRates(dungeonId: number) {
    const dungeon = await this.dungeonRepo.findOne({
      where: { id: dungeonId },
    });

    if (!dungeon) {
      throw new NotFoundException('Dungeon not found');
    }

    // Get all drop tables for this dungeon
    const dropTables = await this.dropTableRepo
      .createQueryBuilder('dt')
      .leftJoinAndSelect('dt.item', 'item')
      .where('dt.dungeon_id = :dungeonId', { dungeonId })
      .orderBy('dt.drop_rate', 'DESC')
      .getMany();

    return {
      dungeon_id: dungeon.id,
      dungeon_name: dungeon.name,
      level_requirement: dungeon.level_req,
      stamina_cost: dungeon.stamina_cost,
      drop_tables: dropTables.map(dt => ({
        item_id: dt.item_id,
        item: dt.item,
        drop_rate: dt.drop_rate,
        min_quantity: dt.min_quantity,
        max_quantity: dt.max_quantity,
        drop_chance_percent: (dt.drop_rate * 100).toFixed(2) + '%',
      })),
      guaranteed_gold: {
        min: dungeon.min_gold,
        max: dungeon.max_gold,
      },
      total_drop_slots: dropTables.length,
    };
  }
}
