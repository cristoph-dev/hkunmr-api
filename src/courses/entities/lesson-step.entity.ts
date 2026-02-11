import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Lesson } from './lesson.entity';
import { LessonStepType } from './lesson-step-type.entity';

@Entity('lesson_steps')
@Unique(['lesson', 'order'])
export class LessonStep {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.steps)
  lesson: Lesson;

  @Column({ type: 'int' })
  order: number;

  @ManyToOne(
    () => LessonStepType,
    (lessonStepType) => lessonStepType.lessonSteps,
  )
  type: LessonStepType;

  @Column()
  prompt: string;

  @Column()
  solution: string;

  @Column()
  options: string;

  @ManyToOne(
    () => LessonStepType,
    (lessonStepType) => lessonStepType.lessonSteps,
  )
  lessonStepType: LessonStepType;

  @Column()
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
