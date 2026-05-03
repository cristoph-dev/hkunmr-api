import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserCourse } from './course-user.entity';
import { Lesson } from './lesson.entity';
import { Classroom } from 'src/classroom/entities/classroom.entity';
import { User } from 'src/users/entities';

export enum CourseScope {
  NATIVE = 'NATIVE',
  TEACHER = 'TEACHER',
}

@Entity('courses')
export class Course {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  title: string;

  @Column()
  is_active: boolean;

  @Column()
  position: number;

  @Column({
    type: 'enum',
    enum: CourseScope,
    default: CourseScope.NATIVE,
  })
  scope: CourseScope;

  @ManyToOne(() => User, (user) => user.authored_courses, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'author_id' })
  author: User | null;

  @OneToMany(() => UserCourse, (userCourse) => userCourse.course)
  users: UserCourse[];

  @OneToMany(() => Lesson, (lesson) => lesson.course)
  lessons: Lesson[];

  @ManyToMany(() => Classroom, (classroom) => classroom.courses)
  classrooms: Classroom[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
