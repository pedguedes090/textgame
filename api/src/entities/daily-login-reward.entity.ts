import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('daily_login_rewards')
export class DailyLoginReward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  user_id: number;

  @Column({ type: 'date' })
  @Index()
  login_date: Date;

  @Column({ default: 1 })
  streak_day: number; // Day 1, 2, 3... in current streak

  @Column({ default: false })
  reward_claimed: boolean;

  @Column({ type: 'text', nullable: true })
  rewards: string; // JSON: { gold: 100, gems: 10, items: [...] }

  @CreateDateColumn()
  created_at: Date;
}
