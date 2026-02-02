import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ type: 'varchar', nullable: false })
  password: string | undefined;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  email_verified: boolean;
}
