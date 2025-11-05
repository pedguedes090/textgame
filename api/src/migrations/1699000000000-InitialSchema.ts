import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1699000000000 implements MigrationInterface {
  name = 'InitialSchema1699000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable foreign keys & WAL mode
    await queryRunner.query(`PRAGMA foreign_keys = ON`);
    await queryRunner.query(`PRAGMA journal_mode = WAL`);
    await queryRunner.query(`PRAGMA busy_timeout = 5000`);

    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "username" TEXT NOT NULL UNIQUE,
        "email_hash" TEXT NOT NULL UNIQUE,
        "pass_hash" TEXT NOT NULL,
        "level" INTEGER NOT NULL DEFAULT 1,
        "exp" INTEGER NOT NULL DEFAULT 0,
        "gold" INTEGER NOT NULL DEFAULT 1000,
        "gems" INTEGER NOT NULL DEFAULT 100,
        "stamina" INTEGER NOT NULL DEFAULT 100,
        "stamina_updated_at" INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        "profile_json" TEXT,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_username" ON "users" ("username")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_email_hash" ON "users" ("email_hash")`);

    // Creature species table
    await queryRunner.query(`
      CREATE TABLE "creature_species" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "base_stats" TEXT NOT NULL,
        "rarity" TEXT NOT NULL,
        "element" TEXT NOT NULL,
        "skills" TEXT,
        "description" TEXT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_species_name" ON "creature_species" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_species_rarity" ON "creature_species" ("rarity")`);
    await queryRunner.query(`CREATE INDEX "IDX_species_element" ON "creature_species" ("element")`);

    // User creatures table
    await queryRunner.query(`
      CREATE TABLE "user_creatures" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "user_id" INTEGER NOT NULL,
        "species_id" INTEGER NOT NULL,
        "level" INTEGER NOT NULL DEFAULT 1,
        "exp" INTEGER NOT NULL DEFAULT 0,
        "iv_rolls" TEXT,
        "skills" TEXT,
        "gear_slots" TEXT,
        "power_score" INTEGER NOT NULL DEFAULT 0,
        "is_favorite" INTEGER NOT NULL DEFAULT 0,
        "obtained_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        FOREIGN KEY ("species_id") REFERENCES "creature_species" ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_creatures_user_id" ON "user_creatures" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_creatures_species_id" ON "user_creatures" ("species_id")`,
    );

    // Items table
    await queryRunner.query(`
      CREATE TABLE "items" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "rarity" TEXT NOT NULL,
        "affixes" TEXT,
        "level_req" INTEGER NOT NULL DEFAULT 1,
        "set_id" INTEGER,
        "description" TEXT,
        "base_value" INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_items_name" ON "items" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_items_type" ON "items" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_items_rarity" ON "items" ("rarity")`);

    // User inventory table
    await queryRunner.query(`
      CREATE TABLE "user_inventory" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "user_id" INTEGER NOT NULL,
        "item_id" INTEGER NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "bound" INTEGER NOT NULL DEFAULT 0,
        "enhance_level" INTEGER NOT NULL DEFAULT 0,
        "obtained_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        FOREIGN KEY ("item_id") REFERENCES "items" ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_user_id" ON "user_inventory" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_inventory_item_id" ON "user_inventory" ("item_id")`);

    // Dungeons table
    await queryRunner.query(`
      CREATE TABLE "dungeons" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "tier" TEXT NOT NULL,
        "recommended_power" INTEGER NOT NULL DEFAULT 100,
        "drop_table_id" INTEGER NOT NULL,
        "boss_json" TEXT,
        "rules_json" TEXT,
        "stamina_cost" INTEGER NOT NULL DEFAULT 10,
        "description" TEXT
      )
    `);

    // Drop tables table
    await queryRunner.query(`
      CREATE TABLE "drop_tables" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "entries" TEXT NOT NULL,
        "alias_data" TEXT
      )
    `);

    // Battles table
    await queryRunner.query(`
      CREATE TABLE "battles" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "type" TEXT NOT NULL,
        "user_id" INTEGER NOT NULL,
        "seed_commit" TEXT,
        "server_seed_reveal" TEXT,
        "log" TEXT,
        "result_json" TEXT,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_battles_type" ON "battles" ("type")`);
    await queryRunner.query(`CREATE INDEX "IDX_battles_user_id" ON "battles" ("user_id")`);

    // PVP matches table
    await queryRunner.query(`
      CREATE TABLE "pvp_matches" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "player_a_id" INTEGER NOT NULL,
        "player_b_id" INTEGER NOT NULL,
        "result" TEXT NOT NULL,
        "rating_delta_a" INTEGER NOT NULL DEFAULT 0,
        "rating_delta_b" INTEGER NOT NULL DEFAULT 0,
        "battle_log" TEXT,
        "season" TEXT,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_pvp_player_a" ON "pvp_matches" ("player_a_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_pvp_player_b" ON "pvp_matches" ("player_b_id")`);

    // Ratings table
    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "user_id" INTEGER PRIMARY KEY,
        "rating" REAL NOT NULL DEFAULT 1500,
        "rd" REAL NOT NULL DEFAULT 350,
        "sigma" REAL NOT NULL DEFAULT 0.06,
        "season" TEXT NOT NULL DEFAULT 'S1',
        "wins" INTEGER NOT NULL DEFAULT 0,
        "losses" INTEGER NOT NULL DEFAULT 0,
        "draws" INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_ratings_season" ON "ratings" ("season")`);

    // Gacha pity table
    await queryRunner.query(`
      CREATE TABLE "gacha_pity" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "user_id" INTEGER NOT NULL,
        "banner_id" TEXT NOT NULL,
        "counter" INTEGER NOT NULL DEFAULT 0,
        "total_rolls" INTEGER NOT NULL DEFAULT 0,
        "history" TEXT,
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_pity_user_id" ON "gacha_pity" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_pity_banner_id" ON "gacha_pity" ("banner_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "gacha_pity"`);
    await queryRunner.query(`DROP TABLE "ratings"`);
    await queryRunner.query(`DROP TABLE "pvp_matches"`);
    await queryRunner.query(`DROP TABLE "battles"`);
    await queryRunner.query(`DROP TABLE "drop_tables"`);
    await queryRunner.query(`DROP TABLE "dungeons"`);
    await queryRunner.query(`DROP TABLE "user_inventory"`);
    await queryRunner.query(`DROP TABLE "items"`);
    await queryRunner.query(`DROP TABLE "user_creatures"`);
    await queryRunner.query(`DROP TABLE "creature_species"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
