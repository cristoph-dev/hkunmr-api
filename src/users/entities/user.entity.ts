import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
  Index,
  ManyToMany,
} from 'typeorm';
import { Role } from './role.entity';
import { UserCourse } from 'src/courses/entities/course-user.entity';
import { Classroom } from 'src/classroom/entities/classroom.entity';

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

  @Index()
  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @OneToMany(() => UserCourse, (userCourse) => userCourse.user)
  courses: UserCourse[];

  @ManyToMany(() => Classroom, (classroom) => classroom.students)
  classrooms: Classroom[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
