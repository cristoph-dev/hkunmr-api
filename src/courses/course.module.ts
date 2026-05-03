import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonStepType } from './entities/lesson-step-type.entity';
import { LessonStep } from './entities/lesson-step.entity';
import { Lesson } from './entities/lesson.entity';
import { Course } from './entities/course.entity';
import { UserCourse } from './entities/course-user.entity';
import { UserLesson } from './entities/lesson-user.entity';
import { CoursesTeacherController } from './controllers/courses.controller';
import { CoursesAdminController } from './controllers/courses-admin.controller';
import { CoursesStudentController } from './controllers/courses-student.controller';
import { LessonsStudentController } from './controllers/lessons.controller';
import { LessonsTeacherController } from './controllers/lessons-teacher.controller';
import { LessonsAdminController } from './controllers/lessons-admin.controller';
import { LessonStepsStudentController } from './controllers/lesson-steps.controller';
import { LessonStepsTeacherController } from './controllers/lesson-steps-teacher.controller';
import { LessonStepsAdminController } from './controllers/lesson-steps-admin.controller';
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
  controllers: [
    CoursesTeacherController,
    CoursesAdminController,
    CoursesStudentController,
    LessonsStudentController,
    LessonsTeacherController,
    LessonsAdminController,
    LessonStepsStudentController,
    LessonStepsTeacherController,
    LessonStepsAdminController,
  ],
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

