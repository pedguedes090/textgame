import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  username: string;

  @Column({ unique: true })
  @Index()
  email_hash: string; // Hash của email để bảo mật

  @Column()
  pass_hash: string; // Argon2

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  exp: number;

  @Column({ default: 1000 })
  gold: number;

  @Column({ default: 100 })
  gems: number;

  @Column({ default: 100 })
  stamina: number;

  @Column({ type: 'bigint', default: () => 'CURRENT_TIMESTAMP' })
  stamina_updated_at: number;

  @Column({ type: 'text', nullable: true })
  profile_json: string; // JSON: avatar, bio, badges

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
