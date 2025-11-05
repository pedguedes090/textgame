import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GachaPity } from 'src/entities/gacha-pity.entity';
import { LootService } from 'src/common/services/loot.service';
import { RngService } from 'src/common/services/rng.service';
import { ItemsService } from '../items/items.service';
import { gameConfig } from 'src/config/game.config';

@Injectable()
export class GachaService {
  constructor(
    @InjectRepository(GachaPity)
    private readonly pityRepo: Repository<GachaPity>,
    private readonly lootService: LootService,
    private readonly rngService: RngService,
    private readonly itemsService: ItemsService,
  ) {}

  async openGacha(userId: number, bannerId: string, clientSeed?: string) {
    const GACHA_COST_GEMS = 100;
    
    // Deduct gems first (throws if insufficient)
    await this.itemsService.deductGems(userId, GACHA_COST_GEMS);
    
    // Get pity
    let pity = await this.pityRepo.findOne({
      where: { user_id: userId, banner_id: bannerId },
    });

    if (!pity) {
      pity = this.pityRepo.create({
        user_id: userId,
        banner_id: bannerId,
        rolls_since_legendary: 0,
        pity_bonus: 0,
      });
      await this.pityRepo.save(pity);
    }

    // RNG
    const serverSeed = this.rngService.generateServerSeed();
    const seedCommit = this.rngService.generateCommit(serverSeed);
    const combined = this.rngService.combinedSeed(clientSeed || 'default', serverSeed);

    let nonce = 0;
    const random = () => {
      const val = this.rngService.rollFloat(combined, nonce);
      nonce++;
      return val;
    };

    // Roll gacha
    const result = this.lootService.rollGacha(random, pity.rolls_since_legendary);

    // Update pity
    if (result.hitPity || ['LEGENDARY', 'MYTHIC', 'ANCIENT'].includes(result.rarity)) {
      pity.rolls_since_legendary = 0;
      pity.pity_bonus = 0;
    } else {
      pity.rolls_since_legendary++;
      if (pity.rolls_since_legendary > gameConfig.pity.threshold) {
        pity.pity_bonus = (pity.rolls_since_legendary - gameConfig.pity.threshold) * gameConfig.pity.increment;
      }
    }
    await this.pityRepo.save(pity);

    // Map rarity to item ID (simplified: assume items 1-7 match rarity order)
    const rarityToItemId = {
      COMMON: 1,
      UNCOMMON: 2,
      RARE: 3,
      EPIC: 4,
      LEGENDARY: 5,
      MYTHIC: 6,
      ANCIENT: 7,
    };
    const itemId = rarityToItemId[result.rarity as keyof typeof rarityToItemId] || 1;
    
    // Save rolled item to inventory
    await this.itemsService.addItemToInventory(userId, itemId, 1, false);

    // Track quest progress - Note: This tracks items, not creatures
    // For creature gacha, would need a separate tracking call
    // await this.questProgressService.trackCollectCreature(userId, result.rarity);

    // Return với odds transparency
    const adjustedOdds = this.lootService.calculatePityOdds(
      gameConfig.rarityOdds.LEGENDARY + gameConfig.rarityOdds.MYTHIC + gameConfig.rarityOdds.ANCIENT,
      pity.rolls_since_legendary,
    );

    return {
      rarity: result.rarity,
      item_id: itemId,
      hit_pity: result.hitPity,
      pity_counter_after: pity.rolls_since_legendary,
      odds: {
        base: gameConfig.rarityOdds,
        adjusted_legendary_plus: adjustedOdds,
      },
      seed_commit: seedCommit,
      server_seed_reveal: serverSeed,
    };
  }
}
