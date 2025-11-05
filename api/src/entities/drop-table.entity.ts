import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('drop_tables')
export class DropTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  entries: string; // JSON: [{item_id, weight, qty_min, qty_max}]

  @Column({ type: 'text', nullable: true })
  alias_data: string; // Precomputed Alias Method tables: {prob, alias} (JSON)

  @Column({ default: 0 })
  total_weight: number; // Cached sum of all weights
}
