import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/users/entities';
import { Course } from 'src/courses/entities/course.entity';

@Entity('classrooms')
export class Classroom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  code: string;

  @ManyToMany(() => User, (user) => user.classrooms)
  students: User[];

  @ManyToOne(() => User)
  teacher: User;

  @ManyToMany(() => Course, (course) => course.classrooms)
  courses: Course[];

  @Column()
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
