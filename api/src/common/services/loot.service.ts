import { Injectable } from '@nestjs/common';
import { gameConfig } from 'src/config/game.config';

export interface DropEntry {
  item_id: number;
  weight: number;
  qty_min: number;
  qty_max: number;
}

export interface AliasTable {
  prob: number[];
  alias: number[];
}

@Injectable()
export class LootService {
  /**
   * Build Alias Method table từ weights O(n)
   */
  buildAliasTable(weights: number[]): AliasTable {
    const n = weights.length;
    const sum = weights.reduce((a, b) => a + b, 0);
    const prob = weights.map((w) => (w * n) / sum);

    const small: number[] = [];
    const large: number[] = [];
    const alias = new Array(n).fill(0);
    const finalProb = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      if (prob[i] < 1.0) small.push(i);
      else large.push(i);
    }

    while (small.length > 0 && large.length > 0) {
      const l = small.pop()!;
      const g = large.pop()!;
      finalProb[l] = prob[l];
      alias[l] = g;
      prob[g] = prob[g] + prob[l] - 1.0;
      if (prob[g] < 1.0) small.push(g);
      else large.push(g);
    }

    while (large.length > 0) {
      const g = large.pop()!;
      finalProb[g] = 1.0;
    }

    while (small.length > 0) {
      const l = small.pop()!;
      finalProb[l] = 1.0;
    }

    return { prob: finalProb, alias };
  }

  /**
   * Draw from alias table O(1)
   */
  drawFromAlias(aliasTable: AliasTable, random: () => number): number {
    const n = aliasTable.prob.length;
    const i = Math.floor(random() * n);
    const r = random();
    return r < aliasTable.prob[i] ? i : aliasTable.alias[i];
  }

  /**
   * Roll loot từ drop table
   */
  rollLoot(
    entries: DropEntry[],
    aliasTable: AliasTable,
    random: () => number,
    count: number = 1,
  ): Array<{ item_id: number; quantity: number }> {
    const results: Array<{ item_id: number; quantity: number }> = [];

    for (let i = 0; i < count; i++) {
      const idx = this.drawFromAlias(aliasTable, random);
      const entry = entries[idx];
      const qty =
        entry.qty_min +
        Math.floor(random() * (entry.qty_max - entry.qty_min + 1));
      results.push({ item_id: entry.item_id, quantity: qty });
    }

    return results;
  }

  /**
   * Calculate pity-adjusted odds cho gacha
   */
  calculatePityOdds(baseLegendaryRate: number, pityCounter: number): number {
    const { threshold, increment } = gameConfig.pity;
    if (pityCounter < threshold) return baseLegendaryRate;
    const bonus = (pityCounter - threshold) * increment;
    return Math.min(baseLegendaryRate + bonus, 100);
  }

  /**
   * Roll gacha với pity
   */
  rollGacha(
    random: () => number,
    pityCounter: number,
  ): { rarity: string; hitPity: boolean } {
    const odds = gameConfig.rarityOdds;
    const legendaryBase =
      odds.LEGENDARY + odds.MYTHIC + odds.ANCIENT;
    const adjustedLegendaryRate = this.calculatePityOdds(legendaryBase, pityCounter);

    const roll = random() * 100;

    // Adjust odds với pity
    const ranges: Array<[number, string]> = [
      [adjustedLegendaryRate, 'LEGENDARY+'], // Huyền thoại+
      [adjustedLegendaryRate + odds.EPIC, 'EPIC'],
      [adjustedLegendaryRate + odds.EPIC + odds.RARE, 'RARE'],
      [adjustedLegendaryRate + odds.EPIC + odds.RARE + odds.UNCOMMON, 'UNCOMMON'],
      [100, 'COMMON'],
    ];

    for (const [threshold, rarity] of ranges) {
      if (roll < threshold) {
        const hitPity = rarity === 'LEGENDARY+' && pityCounter >= gameConfig.pity.threshold;
        
        // Phân bổ chi tiết trong Legendary+
        if (rarity === 'LEGENDARY+') {
          const subRoll = random() * (odds.LEGENDARY + odds.MYTHIC + odds.ANCIENT);
          if (subRoll < odds.ANCIENT) return { rarity: 'ANCIENT', hitPity };
          if (subRoll < odds.ANCIENT + odds.MYTHIC) return { rarity: 'MYTHIC', hitPity };
          return { rarity: 'LEGENDARY', hitPity };
        }

        return { rarity, hitPity: false };
      }
    }

    return { rarity: 'COMMON', hitPity: false };
  }
}
