import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Quest } from './quest.entity';

@Entity('user_quests')
export class UserQuest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  @Index()
  quest_id: number;

  @ManyToOne(() => Quest)
  @JoinColumn({ name: 'quest_id' })
  quest: Quest;

  @Column({ default: 0 })
  current_count: number;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: false })
  claimed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date; // For daily/weekly quests

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
