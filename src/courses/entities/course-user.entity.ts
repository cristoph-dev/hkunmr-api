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
import { User } from 'src/users/entities/user.entity';
import { Course } from './course.entity';
import { ProgressEnum } from 'src/common/lib/const';
import { UserLesson } from './lesson-user.entity';

@Entity('user_course')
@Unique(['user', 'course'])
export class UserCourse {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.courses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Course, (course) => course.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @OneToMany(() => UserLesson, (userLesson) => userLesson.course_user)
  user_lessons: UserLesson[];

  @Column({
    type: 'enum',
    enum: ProgressEnum,
    default: ProgressEnum.NOT_STARTED,
  })
  progress: ProgressEnum;

  @CreateDateColumn()
  enrolled_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
