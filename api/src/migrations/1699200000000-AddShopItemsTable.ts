import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddShopItemsTable1699200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'shop_items',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'item_id',
            type: 'int',
          },
          {
            name: 'price_gold',
            type: 'int',
          },
          {
            name: 'price_gems',
            type: 'int',
            default: 0,
          },
          {
            name: 'available',
            type: 'boolean',
            default: true,
          },
          {
            name: 'stock',
            type: 'int',
            default: -1,
          },
          {
            name: 'min_level',
            type: 'int',
            default: 1,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'discount_percent',
            type: 'int',
            default: 0,
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

    await queryRunner.createForeignKey(
      'shop_items',
      new TableForeignKey({
        columnNames: ['item_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'items',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query('CREATE INDEX idx_shop_items_item_id ON shop_items(item_id)');
    await queryRunner.query('CREATE INDEX idx_shop_items_category ON shop_items(category)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('shop_items');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('item_id') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('shop_items', foreignKey);
      }
    }
    await queryRunner.dropTable('shop_items');
  }
}
