import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { AuthRole } from 'src/common/guards/role.guard';

@Entity('roles')
@Unique(['description'])
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  description: AuthRole;

  @Column({ default: true })
  is_active: boolean;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
