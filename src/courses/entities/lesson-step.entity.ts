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
import { Lesson } from './lesson.entity';
import { LessonStepType } from './lesson-step-type.entity';
import { UserStep } from './lesson-step-user.entity';

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

  @Column()
  prompt: string;

  @Column()
  solution: string;

  @Column({ type: 'json' })
  options: any;

  @ManyToOne(
    () => LessonStepType,
    (lessonStepType) => lessonStepType.lessonSteps,
  )
  lessonStepType: LessonStepType;

  @OneToMany(() => UserStep, (userStep) => userStep.step)
  user_steps: UserStep[];

  @Column()
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
