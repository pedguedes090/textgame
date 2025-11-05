import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { CreatureSpecies } from './creature-species.entity';

@Entity('user_creatures')
export class UserCreature {
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
  species_id: number;

  @ManyToOne(() => CreatureSpecies)
  @JoinColumn({ name: 'species_id' })
  species: CreatureSpecies;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  exp: number;

  @Column({ type: 'text', nullable: true })
  iv_rolls: string; // JSON: {hp, atk, def, spd} IV 0-31

  @Column({ type: 'text', nullable: true })
  skills: string; // JSON array skill instances

  @Column({ type: 'text', nullable: true })
  gear_slots: string; // JSON: {weapon_id, armor_id, charm_id, ring_id}

  @Column({ default: 0 })
  power_score: number; // Tổng power để so sánh

  @Column({ default: false })
  is_favorite: boolean;

  @CreateDateColumn()
  obtained_at: Date;
}
