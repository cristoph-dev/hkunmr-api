import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { LessonStep } from './lesson-step.entity';

@Entity('lesson_step_types')
@Unique(['code'])
export class LessonStepType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @OneToMany(() => LessonStep, (lessonStep) => lessonStep.lessonStepType)
  lessonSteps: LessonStep[];

  @Column()
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
