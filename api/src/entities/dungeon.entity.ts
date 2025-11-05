import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('dungeons')
export class Dungeon {
  @PrimaryColumn()
  id: string; // D1, D2, ..., E1, ..., F1, ...

  @Column()
  name: string;

  @Column()
  tier: string; // NORMAL, ELITE, LEGENDARY

  @Column({ default: 100 })
  recommended_power: number;

  @Column()
  drop_table_id: number;

  @Column({ type: 'text', nullable: true })
  boss_json: string; // JSON boss stats

  @Column({ type: 'text', nullable: true })
  rules_json: string; // JSON: {enrage_turn, special_mechanics}

  @Column({ default: 10 })
  stamina_cost: number;

  @Column({ nullable: true })
  description: string;
}
