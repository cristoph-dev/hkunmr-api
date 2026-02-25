import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { ProgressEnum } from 'src/common/lib/const';
import { Lesson } from './lesson.entity';
import { UserCourse } from './course-user.entity';
import { UserStep } from './lesson-step-user.entity';

@Entity('user_lesson')
@Unique(['course_user', 'lesson'])
export class UserLesson {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserCourse, (user) => user.user_lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_user_id' })
  course_user: UserCourse;

  @ManyToOne(() => Lesson, (lesson) => lesson.user_lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @OneToMany(() => UserStep, (userStep) => userStep.user_lesson)
  user_steps: UserStep[];

  @Column({
    type: 'enum',
    enum: ProgressEnum,
    default: ProgressEnum.NOT_STARTED,
  })
  progress: ProgressEnum;

  @CreateDateColumn()
  started_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
