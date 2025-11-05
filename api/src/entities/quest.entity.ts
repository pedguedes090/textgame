import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('quests')
export class Quest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  @Index()
  type: string; // DAILY, WEEKLY, STORY, ACHIEVEMENT

  @Column()
  objective_type: string; // HUNT, DUNGEON, PVP, ENHANCE, GACHA, LOGIN

  @Column({ default: 1 })
  target_count: number;

  @Column({ type: 'text', nullable: true })
  rewards: string; // JSON: {gold, gems, items: [{item_id, quantity}]}

  @Column({ default: 1 })
  min_level: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
