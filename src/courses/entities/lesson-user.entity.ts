import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ProgressEnum } from 'src/common/lib/const';
import { Lesson } from './lesson.entity';

@Entity('user_lesson')
@Unique(['user', 'lesson'])
export class UserLesson {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.courses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Lesson, (lesson) => lesson.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

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
