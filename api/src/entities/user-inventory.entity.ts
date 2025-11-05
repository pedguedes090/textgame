import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Item } from './item.entity';

@Entity('user_inventory')
export class UserInventory {
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
  item_id: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: false })
  bound: boolean; // Khóa, không trade được

  @Column({ default: 0 })
  enhance_level: number; // +0 -> +15

  @CreateDateColumn()
  obtained_at: Date;
}
