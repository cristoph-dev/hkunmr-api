import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50 })
  lastname: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  password: string | undefined;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  email_verified: boolean;

  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
