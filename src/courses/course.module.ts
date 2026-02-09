import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonStepType } from './entities/lesson-step-type.entity';
import { LessonStep } from './entities/lesson-step.entity';
import { Lesson } from './entities/lesson.entity';
import { Course } from './entities/course.entity';
import { UserCourse } from './entities/course-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonStepType,
      LessonStep,
      Lesson,
      Course,
      UserCourse,
    ]),
  ],
})
export class CoursesModule {}
