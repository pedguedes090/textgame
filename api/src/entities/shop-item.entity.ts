import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('shop_items')
export class ShopItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  item_id: number;

  @Column()
  price_gold: number;

  @Column({ default: 0 })
  price_gems: number;

  @Column({ default: true })
  available: boolean;

  @Column({ default: -1 })
  stock: number; // -1 = unlimited

  @Column({ default: 1 })
  min_level: number;

  @Column({ nullable: true })
  category: string; // CONSUMABLE, EQUIPMENT, MATERIAL, SPECIAL

  @Column({ default: 0 })
  discount_percent: number; // 0-100

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
