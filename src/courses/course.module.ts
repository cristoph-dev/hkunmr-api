import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonStepType } from './entities/lesson-step-type.entity';
import { LessonStep } from './entities/lesson-step.entity';
import { Lesson } from './entities/lesson.entity';
import { Course } from './entities/course.entity';
import { UserCourse } from './entities/course-user.entity';
import { UserLesson } from './entities/lesson-user.entity';
import { CoursesController } from './controllers/courses.controller';
import { LessonsController } from './controllers/lessons.controller';
import { LessonStepsController } from './controllers/lesson-steps.controller';
import { CoursesService } from './services/courses.service';
import { LessonsService } from './services/lessons.service';
import { LessonStepsService } from './services/lesson-steps.service';
import { UserCoursesService } from './services/user-courses.service';
import { UserLessonsService } from './services/user-lessons.service';
import { UserStep } from './entities/lesson-step-user.entity';
import { User, Role } from 'src/users/entities';
import { Classroom } from 'src/classroom/entities/classroom.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonStepType,
      LessonStep,
      Lesson,
      Course,
      UserCourse,
      UserLesson,
      UserStep,
      User,
      Role,
      Classroom,
    ]),
  ],
  controllers: [CoursesController, LessonsController, LessonStepsController],
  providers: [
    CoursesService,
    LessonsService,
    LessonStepsService,
    UserCoursesService,
    UserLessonsService,
  ],
  exports: [
    CoursesService,
    LessonsService,
    LessonStepsService,
    UserCoursesService,
    UserLessonsService,
  ],
})
export class CoursesModule { }
