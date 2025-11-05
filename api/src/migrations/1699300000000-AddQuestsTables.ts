import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddQuestsTables1699300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create quests table
    await queryRunner.createTable(
      new Table({
        name: 'quests',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'objective_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'target_count',
            type: 'int',
            default: 1,
          },
          {
            name: 'rewards',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'min_level',
            type: 'int',
            default: 1,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create user_quests table
    await queryRunner.createTable(
      new Table({
        name: 'user_quests',
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
          },
          {
            name: 'quest_id',
            type: 'int',
          },
          {
            name: 'current_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'claimed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'user_quests',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_quests',
      new TableForeignKey({
        columnNames: ['quest_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'quests',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.query('CREATE INDEX idx_quests_type ON quests(type)');
    await queryRunner.query('CREATE INDEX idx_user_quests_user_id ON user_quests(user_id)');
    await queryRunner.query('CREATE INDEX idx_user_quests_quest_id ON user_quests(quest_id)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userQuestsTable = await queryRunner.getTable('user_quests');
    const foreignKeys = userQuestsTable.foreignKeys;
    for (const fk of foreignKeys) {
      await queryRunner.dropForeignKey('user_quests', fk);
    }
    
    await queryRunner.dropTable('user_quests');
    await queryRunner.dropTable('quests');
  }
}
