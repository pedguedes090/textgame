import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddDailyLoginRewards1699400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'daily_login_rewards',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'login_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'streak_day',
            type: 'int',
            default: 1,
            isNullable: false,
          },
          {
            name: 'reward_claimed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'rewards',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'daily_login_rewards',
      new TableIndex({
        name: 'IDX_daily_login_rewards_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'daily_login_rewards',
      new TableIndex({
        name: 'IDX_daily_login_rewards_login_date',
        columnNames: ['login_date'],
      }),
    );

    // Create unique constraint for user_id + login_date
    await queryRunner.createIndex(
      'daily_login_rewards',
      new TableIndex({
        name: 'UQ_daily_login_rewards_user_date',
        columnNames: ['user_id', 'login_date'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('daily_login_rewards');
  }
}
