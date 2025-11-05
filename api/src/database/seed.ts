import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { CreatureSpecies } from '../entities/creature-species.entity';
import { Item } from '../entities/item.entity';
import { Dungeon } from '../entities/dungeon.entity';
import { DropTable } from '../entities/drop-table.entity';

const dataSource = new DataSource(typeOrmConfig);

async function seed() {
  await dataSource.initialize();
  console.log('🌱 Seeding database...');

  // Seed creature species
  const speciesRepo = dataSource.getRepository(CreatureSpecies);
  const species = [
    {
      name: 'Fire Dragon',
      base_stats: JSON.stringify({ hp: 500, atk: 120, def: 80, spd: 60, crit_rate: 0.1, crit_dmg: 1.5 }),
      rarity: 'LEGENDARY',
      element: 'FIRE',
      skills: JSON.stringify([
        { name: 'Flame Breath', dmg_mult: 2.0, effect: 'burn' },
        { name: 'Claw Strike', dmg_mult: 1.5 },
      ]),
      description: 'A legendary fire dragon',
    },
    {
      name: 'Water Serpent',
      base_stats: JSON.stringify({ hp: 450, atk: 100, def: 90, spd: 70, crit_rate: 0.08, crit_dmg: 1.4 }),
      rarity: 'EPIC',
      element: 'WATER',
      skills: JSON.stringify([{ name: 'Tidal Wave', dmg_mult: 1.8 }]),
      description: 'An epic water serpent',
    },
    {
      name: 'Forest Sprite',
      base_stats: JSON.stringify({ hp: 300, atk: 80, def: 60, spd: 90, crit_rate: 0.15, crit_dmg: 1.6 }),
      rarity: 'RARE',
      element: 'WOOD',
      skills: JSON.stringify([{ name: 'Nature Bolt', dmg_mult: 1.5 }]),
      description: 'A rare forest sprite',
    },
    {
      name: 'Shadow Wolf',
      base_stats: JSON.stringify({ hp: 400, atk: 110, def: 70, spd: 80, crit_rate: 0.12, crit_dmg: 1.55 }),
      rarity: 'EPIC',
      element: 'DARK',
      skills: JSON.stringify([{ name: 'Shadow Bite', dmg_mult: 1.7 }]),
      description: 'An epic shadow wolf',
    },
    {
      name: 'Light Phoenix',
      base_stats: JSON.stringify({ hp: 550, atk: 130, def: 75, spd: 65, crit_rate: 0.11, crit_dmg: 1.6 }),
      rarity: 'MYTHIC',
      element: 'LIGHT',
      skills: JSON.stringify([
        { name: 'Solar Flare', dmg_mult: 2.2 },
        { name: 'Radiant Beam', dmg_mult: 1.8 },
      ]),
      description: 'A mythic light phoenix',
    },
  ];

  for (const s of species) {
    const existing = await speciesRepo.findOne({ where: { name: s.name } });
    if (!existing) {
      await speciesRepo.save(s);
    }
  }
  console.log('✅ Seeded creature species');

  // Seed items
  const itemRepo = dataSource.getRepository(Item);
  const items = [
    {
      name: 'Iron Sword',
      type: 'WEAPON',
      rarity: 'COMMON',
      affixes: JSON.stringify([{ stat: 'atk', value: 20, tier: 1 }]),
      level_req: 1,
      base_value: 100,
    },
    {
      name: 'Steel Armor',
      type: 'ARMOR',
      rarity: 'UNCOMMON',
      affixes: JSON.stringify([{ stat: 'def', value: 30, tier: 2 }]),
      level_req: 5,
      base_value: 250,
    },
    {
      name: 'Ruby Ring',
      type: 'RING',
      rarity: 'RARE',
      affixes: JSON.stringify([
        { stat: 'atk', value: 15, tier: 3 },
        { stat: 'crit_rate', value: 0.05, tier: 3 },
      ]),
      level_req: 10,
      base_value: 500,
    },
    {
      name: 'Dragon Scale Armor',
      type: 'ARMOR',
      rarity: 'LEGENDARY',
      affixes: JSON.stringify([
        { stat: 'def', value: 100, tier: 5 },
        { stat: 'hp', value: 200, tier: 5 },
      ]),
      level_req: 20,
      set_id: 1,
      base_value: 2000,
    },
    {
      name: 'Phoenix Feather Charm',
      type: 'CHARM',
      rarity: 'MYTHIC',
      affixes: JSON.stringify([
        { stat: 'atk', value: 50, tier: 5 },
        { stat: 'spd', value: 20, tier: 5 },
      ]),
      level_req: 25,
      base_value: 5000,
    },
  ];

  for (const item of items) {
    const existing = await itemRepo.findOne({ where: { name: item.name } });
    if (!existing) {
      await itemRepo.save(item);
    }
  }
  console.log('✅ Seeded items');

  // Seed drop tables
  const dropTableRepo = dataSource.getRepository(DropTable);
  const dropTables = [
    {
      name: 'Normal Dungeon Loot',
      entries: JSON.stringify([
        { item_id: 1, weight: 50, qty_min: 1, qty_max: 1 }, // Iron Sword
        { item_id: 2, weight: 30, qty_min: 1, qty_max: 1 }, // Steel Armor
        { item_id: 3, weight: 15, qty_min: 1, qty_max: 1 }, // Ruby Ring
        { item_id: 4, weight: 4, qty_min: 1, qty_max: 1 },  // Dragon Scale
        { item_id: 5, weight: 1, qty_min: 1, qty_max: 1 },  // Phoenix Feather
      ]),
    },
    {
      name: 'Elite Dungeon Loot',
      entries: JSON.stringify([
        { item_id: 2, weight: 40, qty_min: 1, qty_max: 2 },
        { item_id: 3, weight: 35, qty_min: 1, qty_max: 1 },
        { item_id: 4, weight: 20, qty_min: 1, qty_max: 1 },
        { item_id: 5, weight: 5, qty_min: 1, qty_max: 1 },
      ]),
    },
  ];

  for (const dt of dropTables) {
    const existing = await dropTableRepo.findOne({ where: { name: dt.name } });
    if (!existing) {
      await dropTableRepo.save(dt);
    }
  }
  console.log('✅ Seeded drop tables');

  // Seed dungeons
  const dungeonRepo = dataSource.getRepository(Dungeon);
  const dungeons = [
    {
      id: 'D1',
      name: 'Forest Outskirts',
      tier: 'NORMAL',
      recommended_power: 100,
      drop_table_id: 1,
      boss_json: JSON.stringify({
        name: 'Giant Slime',
        base_stats: { hp: 300, atk: 50, def: 30, spd: 40 },
        level: 5,
        element: 'NEUTRAL',
        skills: [{ name: 'Slam', dmg_mult: 1.2 }],
      }),
      rules_json: JSON.stringify({ enrage_turn: 15 }),
      stamina_cost: 10,
      description: 'A beginner dungeon',
    },
    {
      id: 'D2',
      name: 'Mountain Cave',
      tier: 'NORMAL',
      recommended_power: 200,
      drop_table_id: 1,
      boss_json: JSON.stringify({
        name: 'Rock Golem',
        base_stats: { hp: 500, atk: 70, def: 80, spd: 30 },
        level: 10,
        element: 'NEUTRAL',
        skills: [{ name: 'Boulder Throw', dmg_mult: 1.5 }],
      }),
      rules_json: JSON.stringify({ enrage_turn: 12 }),
      stamina_cost: 15,
      description: 'An intermediate dungeon',
    },
    {
      id: 'D3',
      name: 'Ancient Ruins',
      tier: 'NORMAL',
      recommended_power: 350,
      drop_table_id: 1,
      boss_json: JSON.stringify({
        name: 'Skeleton King',
        base_stats: { hp: 700, atk: 90, def: 60, spd: 50 },
        level: 15,
        element: 'DARK',
        skills: [
          { name: 'Dark Slash', dmg_mult: 1.7 },
          { name: 'Soul Drain', dmg_mult: 1.3, effect: 'heal' },
        ],
      }),
      rules_json: JSON.stringify({ enrage_turn: 10 }),
      stamina_cost: 20,
      description: 'An advanced dungeon',
    },
    {
      id: 'E1',
      name: 'Fire Temple',
      tier: 'ELITE',
      recommended_power: 500,
      drop_table_id: 2,
      boss_json: JSON.stringify({
        name: 'Flame Lord',
        base_stats: { hp: 1000, atk: 120, def: 70, spd: 60 },
        level: 20,
        element: 'FIRE',
        skills: [
          { name: 'Inferno', dmg_mult: 2.0 },
          { name: 'Meteor Strike', dmg_mult: 1.8 },
        ],
      }),
      rules_json: JSON.stringify({ enrage_turn: 10 }),
      stamina_cost: 30,
      description: 'An elite fire dungeon',
    },
    {
      id: 'E2',
      name: 'Frozen Citadel',
      tier: 'ELITE',
      recommended_power: 700,
      drop_table_id: 2,
      boss_json: JSON.stringify({
        name: 'Ice Queen',
        base_stats: { hp: 1200, atk: 110, def: 90, spd: 55 },
        level: 25,
        element: 'WATER',
        skills: [
          { name: 'Blizzard', dmg_mult: 1.9 },
          { name: 'Frost Spike', dmg_mult: 1.6 },
        ],
      }),
      rules_json: JSON.stringify({ enrage_turn: 9 }),
      stamina_cost: 40,
      description: 'An elite ice dungeon',
    },
    {
      id: 'F1',
      name: 'Dragon Lair',
      tier: 'LEGENDARY',
      recommended_power: 1000,
      drop_table_id: 2,
      boss_json: JSON.stringify({
        name: 'Ancient Dragon',
        base_stats: { hp: 2000, atk: 150, def: 100, spd: 70 },
        level: 30,
        element: 'FIRE',
        skills: [
          { name: 'Dragon Rage', dmg_mult: 2.5 },
          { name: 'Tail Sweep', dmg_mult: 1.4 },
          { name: 'Fire Nova', dmg_mult: 2.0 },
        ],
      }),
      rules_json: JSON.stringify({ enrage_turn: 8 }),
      stamina_cost: 50,
      description: 'A legendary dragon dungeon',
    },
  ];

  for (const dungeon of dungeons) {
    const existing = await dungeonRepo.findOne({ where: { id: dungeon.id } });
    if (!existing) {
      await dungeonRepo.save(dungeon);
    }
  }
  console.log('✅ Seeded dungeons');

  await dataSource.destroy();
  console.log('🎉 Seeding complete!');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
