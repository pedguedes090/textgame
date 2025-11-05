import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  name: string;

  @Column()
  @Index()
  type: string; // WEAPON, ARMOR, CHARM, RING, CONSUMABLE, MATERIAL

  @Column()
  @Index()
  rarity: string;

  @Column({ type: 'text', nullable: true })
  affixes: string; // JSON: [{stat, value, tier}]

  @Column({ default: 1 })
  level_req: number;

  @Column({ nullable: true })
  set_id: number; // Set bonus (nullable)

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  base_value: number; // Giá bán
}
