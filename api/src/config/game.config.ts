export const gameConfig = {
  // Rarity odds (base)
  rarityOdds: {
    COMMON: 55,
    UNCOMMON: 25,
    RARE: 12,
    EPIC: 6,
    LEGENDARY: 2,
    MYTHIC: 0.8,
    ANCIENT: 0.2,
  },

  // Pity system
  pity: {
    threshold: 50, // Sau 50 lần không ra Legendary+
    increment: 0.3, // +0.3% mỗi lần
  },

  // Element advantages
  elementAdvantage: {
    FIRE: 'WOOD',
    WOOD: 'WATER',
    WATER: 'FIRE',
    LIGHT: 'DARK',
    DARK: 'LIGHT',
  },
  elementBonus: 0.1, // ±10% dmg

  // Combat
  combat: {
    defenseConstant: 400,
    critMultiplier: 1.5,
    enrageTurn: 10, // Boss enrage sau turn 10
    enrageBonus: 0.3, // +30% ATK
  },

  // Stamina
  stamina: {
    max: 100,
    regenInterval: 300000, // 5 phút (ms)
    regenAmount: 1,
  },

  // Enhancement
  enhance: {
    maxLevel: 15,
    baseCost: 100,
    costMultiplier: 1.5,
    successRate: [
      1.0,
      1.0,
      1.0,
      1.0,
      1.0, // +0 -> +5: 100%
      0.9,
      0.8,
      0.7,
      0.6,
      0.5, // +6 -> +10
      0.4,
      0.3,
      0.2,
      0.15,
      0.1, // +11 -> +15
    ],
  },

  // XP formula
  xp: {
    formula: (level: number) => 50 * level * level + 100 * level,
  },

  // Rate limiting
  rateLimit: {
    ttl: 60, // seconds
    max: 100, // requests
  },

  // PVP
  pvp: {
    initialRating: 1500,
    kFactor: 32,
  },
};
