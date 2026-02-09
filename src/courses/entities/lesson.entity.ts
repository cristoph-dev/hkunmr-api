import { Course } from 'src/courses/entities/course.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
  OneToMany,
} from 'typeorm';
import { LessonStep } from './lesson-step.entity';
import { UserLesson } from './lesson-user.entity';

@Entity('lessons')
@Unique(['course', 'order'])
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(() => Course, (course) => course.lessons)
  course: Course;

  @OneToMany(() => LessonStep, (step) => step.lesson)
  steps: LessonStep[];

  @OneToMany(() => UserLesson, (userLesson) => userLesson.user)
  users: UserLesson[];

  @Column({ type: 'int' })
  order: number;

  @Column()
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
