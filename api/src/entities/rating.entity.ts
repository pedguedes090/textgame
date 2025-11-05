import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('ratings')
export class Rating {
  @PrimaryColumn()
  user_id: number;

  @Column({ type: 'real', default: 1500 })
  rating: number;

  @Column({ type: 'real', default: 350 })
  rd: number; // Rating deviation (Glicko-2)

  @Column({ type: 'real', default: 0.06 })
  sigma: number; // Volatility (Glicko-2)

  @Column({ default: 'S1' })
  @Index()
  season: string;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  losses: number;

  @Column({ default: 0 })
  draws: number;
}
