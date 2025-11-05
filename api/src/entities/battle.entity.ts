import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('battles')
export class Battle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  type: string; // HUNT, DUNGEON, PVP

  @Column()
  @Index()
  user_id: number;

  @Column({ nullable: true })
  seed_commit: string; // Hash trước trận

  @Column({ nullable: true })
  server_seed_reveal: string; // Reveal sau trận

  @Column({ type: 'text', nullable: true })
  log: string; // JSON battle log

  @Column({ type: 'text', nullable: true })
  result_json: string; // JSON: {victory, drops, exp}

  @CreateDateColumn()
  created_at: Date;
}
