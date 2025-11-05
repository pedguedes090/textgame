import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCreature } from 'src/entities/user-creature.entity';
import { CreatureSpecies } from 'src/entities/creature-species.entity';
import { User } from 'src/entities/user.entity';
import { UserInventory } from 'src/entities/user-inventory.entity';
import { gameConfig } from 'src/config/game.config';

@Injectable()
export class CreatureProgressionService {
  constructor(
    @InjectRepository(UserCreature)
    private readonly creatureRepo: Repository<UserCreature>,
    @InjectRepository(CreatureSpecies)
    private readonly speciesRepo: Repository<CreatureSpecies>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserInventory)
    private readonly inventoryRepo: Repository<UserInventory>,
  ) {}

  /**
   * Calculate EXP required for next level
   */
  calculateExpForLevel(level: number): number {
    // Formula: 50 * level^2 + 100 * level
    return 50 * level * level + 100 * level;
  }

  /**
   * Calculate stat growth per level
   * Base stats grow by ~5% per level with IV influence
   */
  calculateStatGrowth(baseStat: number, iv: number, level: number): number {
    // Growth = baseStat * (1 + 0.05 * level) * (1 + iv/62)
    const levelMultiplier = 1 + (0.05 * level);
    const ivMultiplier = 1 + (iv / 62); // IV 0-31 gives 0-50% bonus
    return Math.floor(baseStat * levelMultiplier * ivMultiplier);
  }

  /**
   * Calculate total creature stats including level, IV, and equipment
   */
  async calculateCreatureStats(creature: UserCreature, includeEquipment: boolean = true): Promise<any> {
    const species = await this.speciesRepo.findOne({
      where: { id: creature.species_id },
    });

    if (!species) {
      throw new Error('Species not found');
    }

    // Parse base stats from JSON
    const baseStats = JSON.parse(species.base_stats);

    // Parse IV rolls
    const ivRolls = creature.iv_rolls ? JSON.parse(creature.iv_rolls) : { hp: 15, atk: 15, def: 15, spd: 15 };

    // Calculate stats with growth
    let hp = this.calculateStatGrowth(baseStats.hp || 100, ivRolls.hp, creature.level);
    let atk = this.calculateStatGrowth(baseStats.atk || 50, ivRolls.atk, creature.level);
    let def = this.calculateStatGrowth(baseStats.def || 40, ivRolls.def, creature.level);
    let spd = this.calculateStatGrowth(baseStats.spd || 60, ivRolls.spd, creature.level);

    // Add equipment bonuses from gear_slots
    if (includeEquipment) {
      const equipmentBonus = await this.calculateEquipmentBonus(creature);
      hp += equipmentBonus.hp;
      atk += equipmentBonus.atk;
      def += equipmentBonus.def;
      spd += equipmentBonus.spd;
    }

    return {
      hp,
      atk,
      def,
      spd,
      crit_rate: baseStats.crit_rate || 0.05,
      crit_dmg: baseStats.crit_dmg || 1.5,
      element: species.element,
    };
  }

  /**
   * Calculate equipment bonuses from equipped items
   */
  async calculateEquipmentBonus(creature: UserCreature): Promise<{
    hp: number;
    atk: number;
    def: number;
    spd: number;
  }> {
    const bonus = { hp: 0, atk: 0, def: 0, spd: 0 };

    try {
      const gearSlots = creature.gear_slots ? JSON.parse(creature.gear_slots) : {};
      const inventoryIds = Object.values(gearSlots).filter(id => id) as number[];

      if (inventoryIds.length === 0) {
        return bonus;
      }

      // Get all equipped items
      const equippedItems = await this.inventoryRepo
        .createQueryBuilder('inv')
        .leftJoinAndSelect('inv.item', 'item')
        .where('inv.id IN (:...ids)', { ids: inventoryIds })
        .getMany();

      // Calculate bonuses from each item
      for (const invItem of equippedItems) {
        if (!invItem.item) continue;

        // Parse affixes (stats bonuses)
        const affixes = invItem.item.affixes ? JSON.parse(invItem.item.affixes) : [];
        
        for (const affix of affixes) {
          const stat = affix.stat?.toLowerCase();
          let value = affix.value || 0;

          // Enhancement bonus: +10% per enhancement level
          const enhanceMultiplier = 1 + (invItem.enhance_lv || 0) * 0.1;
          value = Math.floor(value * enhanceMultiplier);

          if (stat === 'hp') bonus.hp += value;
          else if (stat === 'atk' || stat === 'attack') bonus.atk += value;
          else if (stat === 'def' || stat === 'defense') bonus.def += value;
          else if (stat === 'spd' || stat === 'speed') bonus.spd += value;
        }
      }
    } catch (error) {
      console.error('Error calculating equipment bonus:', error);
    }

    return bonus;
  }

  /**
   * Add EXP to creature and handle level ups
   */
  async addExp(
    userId: number,
    creatureId: number,
    expGained: number,
  ): Promise<{
    creature: UserCreature;
    levelsGained: number;
    newStats: any;
  }> {
    const creature = await this.creatureRepo.findOne({
      where: { id: creatureId, user_id: userId },
      relations: ['species'],
    });

    if (!creature) {
      throw new Error('Creature not found');
    }

    const maxLevel = 100; // Max level cap
    if (creature.level >= maxLevel) {
      return { creature, levelsGained: 0, newStats: await this.calculateCreatureStats(creature) };
    }

    let currentExp = creature.exp + expGained;
    let currentLevel = creature.level;
    let levelsGained = 0;

    // Process level ups
    while (currentLevel < maxLevel) {
      const expRequired = this.calculateExpForLevel(currentLevel);
      
      if (currentExp >= expRequired) {
        currentExp -= expRequired;
        currentLevel++;
        levelsGained++;
      } else {
        break;
      }
    }

    // Update creature
    creature.level = currentLevel;
    creature.exp = currentExp;

    // Recalculate power score
    const newStats = await this.calculateCreatureStats(creature);
    creature.power_score = this.calculatePowerScore(newStats);

    await this.creatureRepo.save(creature);

    return {
      creature,
      levelsGained,
      newStats,
    };
  }

  /**
   * Calculate overall power score for comparison
   */
  calculatePowerScore(stats: any): number {
    return Math.floor(
      stats.hp * 0.5 +
      stats.atk * 2 +
      stats.def * 1.5 +
      stats.spd * 1.0
    );
  }

  /**
   * Award exp to party creatures after battle
   */
  async awardExpToParty(
    userId: number,
    creatureIds: number[],
    baseExp: number,
  ): Promise<any[]> {
    const results = [];

    for (const creatureId of creatureIds) {
      try {
        const result = await this.addExp(userId, creatureId, baseExp);
        results.push({
          creature_id: creatureId,
          exp_gained: baseExp,
          levels_gained: result.levelsGained,
          new_level: result.creature.level,
          new_stats: result.newStats,
        });
      } catch (error) {
        console.error(`Error awarding exp to creature ${creatureId}:`, error);
      }
    }

    return results;
  }

  /**
   * Check if creature can evolve
   */
  async checkEvolution(creatureId: number): Promise<{
    canEvolve: boolean;
    nextEvolution?: CreatureSpecies;
    requirements?: any;
  }> {
    const creature = await this.creatureRepo.findOne({
      where: { id: creatureId },
      relations: ['species'],
    });

    if (!creature || !creature.species) {
      return { canEvolve: false };
    }

    // Check if species has evolution data
    const evolutionData = creature.species.evolution_data 
      ? JSON.parse(creature.species.evolution_data) 
      : null;

    if (!evolutionData || !evolutionData.evolves_to) {
      return { canEvolve: false };
    }

    // Check level requirement
    const requiredLevel = evolutionData.required_level || 30;
    if (creature.level < requiredLevel) {
      return {
        canEvolve: false,
        requirements: {
          level: requiredLevel,
          current_level: creature.level,
        },
      };
    }

    // Get next evolution species
    const nextSpecies = await this.speciesRepo.findOne({
      where: { id: evolutionData.evolves_to },
    });

    return {
      canEvolve: true,
      nextEvolution: nextSpecies || undefined,
      requirements: {
        level: requiredLevel,
        item: evolutionData.required_item,
      },
    };
  }

  /**
   * Evolve creature to next form
   */
  async evolveCreature(
    userId: number,
    creatureId: number,
  ): Promise<UserCreature> {
    const creature = await this.creatureRepo.findOne({
      where: { id: creatureId, user_id: userId },
      relations: ['species'],
    });

    if (!creature) {
      throw new Error('Creature not found');
    }

    const evolutionCheck = await this.checkEvolution(creatureId);
    if (!evolutionCheck.canEvolve || !evolutionCheck.nextEvolution) {
      throw new Error('Creature cannot evolve yet');
    }

    // Update to new species
    creature.species_id = evolutionCheck.nextEvolution.id;
    
    // Keep current level and exp
    // Recalculate stats and power score
    const newStats = await this.calculateCreatureStats(creature);
    creature.power_score = this.calculatePowerScore(newStats);

    await this.creatureRepo.save(creature);

    return creature;
  }

  /**
   * Get creatures by user with calculated stats
   */
  async getUserCreaturesWithStats(userId: number): Promise<any[]> {
    const creatures = await this.creatureRepo.find({
      where: { user_id: userId },
      relations: ['species'],
      order: { power_score: 'DESC' },
    });

    const result = [];
    for (const creature of creatures) {
      const stats = await this.calculateCreatureStats(creature);
      const expToNext = this.calculateExpForLevel(creature.level);
      const evolution = await this.checkEvolution(creature.id);

      result.push({
        ...creature,
        current_stats: stats,
        exp_to_next_level: expToNext,
        exp_progress: `${creature.exp}/${expToNext}`,
        evolution: evolution.canEvolve ? {
          can_evolve: true,
          next_species: evolution.nextEvolution?.name,
        } : null,
      });
    }

    return result;
  }
}
