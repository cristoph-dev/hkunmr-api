import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
}
