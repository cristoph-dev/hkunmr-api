import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { UserCourse } from './course-user.entity';
import { Lesson } from './lesson.entity';
import { Classroom } from 'src/classroom/entities/classroom.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => UserCourse, (userCourse) => userCourse.course)
  users: UserCourse[];

  @Column()
  is_active: boolean;

  @OneToMany(() => Lesson, (lesson) => lesson.course)
  lessons: Lesson[];

  @Column()
  position: number;

  @ManyToMany(() => Classroom, (classroom) => classroom.courses)
  classrooms: Classroom[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
