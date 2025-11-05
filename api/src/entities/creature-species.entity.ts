import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('creature_species')
export class CreatureSpecies {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  name: string;

  @Column({ type: 'text' })
  base_stats: string; // JSON: {hp, atk, def, spd, crit_rate, crit_dmg}

  @Column()
  @Index()
  rarity: string; // COMMON, UNCOMMON, RARE, EPIC, LEGENDARY, MYTHIC, ANCIENT

  @Column()
  @Index()
  element: string; // FIRE, WATER, WOOD, LIGHT, DARK, NEUTRAL

  @Column({ type: 'text', nullable: true })
  skills: string; // JSON array: [{name, dmg_mult, effect}]

  @Column({ nullable: true })
  description: string;
}
