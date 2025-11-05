import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('gacha_pity')
export class GachaPity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  user_id: number;

  @Column()
  @Index()
  banner_id: string;

  @Column({ default: 0 })
  rolls_since_legendary: number; // Số lần roll từ lần trúng Legendary+ cuối

  @Column({ type: 'real', default: 0 })
  pity_bonus: number; // % bonus hiện tại (+0.3% mỗi roll sau 50)

  @Column({ type: 'text', nullable: true })
  last_legendary_item: string; // JSON: {item_id, rarity, timestamp}

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
