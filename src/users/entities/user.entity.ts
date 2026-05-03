import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from './role.entity';
import { UserCourse } from 'src/courses/entities/course-user.entity';
import { Classroom } from 'src/classroom/entities/classroom.entity';
import { Course } from 'src/courses/entities/course.entity';

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

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_image: string | null;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({ name: 'users_roles' })
  roles: Role[];

  @OneToMany(() => UserCourse, (userCourse) => userCourse.user)
  courses: UserCourse[];

  @ManyToMany(() => Classroom, (classroom) => classroom.students)
  classrooms: Classroom[];

  @OneToMany(() => Course, (course) => course.author)
  authored_courses: Course[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
