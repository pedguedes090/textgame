import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('pvp_matches')
export class PvpMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  player_a_id: number;

  @Column()
  @Index()
  player_b_id: number;

  @Column()
  result: string; // WIN_A, WIN_B, DRAW

  @Column({ default: 0 })
  rating_delta_a: number;

  @Column({ default: 0 })
  rating_delta_b: number;

  @Column({ type: 'text', nullable: true })
  battle_log: string; // JSON log

  @Column({ nullable: true })
  season: string;

  @CreateDateColumn()
  created_at: Date;
}
