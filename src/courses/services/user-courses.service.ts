import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCourse } from '../entities/course-user.entity';
import { Course } from '../entities/course.entity';
import { UserLessonsService } from './user-lessons.service';
import { ProgressEnum } from 'src/common/lib/const';

@Injectable()
export class UserCoursesService {
  constructor(
    @InjectRepository(UserCourse)
    private readonly userCourseRepository: Repository<UserCourse>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly userLessonsService: UserLessonsService,
  ) {}

  async isEnrolled(courseId: number, userId: number): Promise<boolean> {
    const enrollment = await this.userCourseRepository.findOne({
      where: {
        course: { id: courseId },
        user: { id: userId },
      },
    });

    return !!enrollment;
  }

  async getEnrollment(
    courseId: number,
    userId: number,
  ): Promise<UserCourse | null> {
    return await this.userCourseRepository.findOne({
      where: {
        course: { id: courseId },
        user: { id: userId },
      },
      relations: ['course', 'user'],
    });
  }

  async enroll(courseId: number, userId: number): Promise<UserCourse> {
    // Fetch course and check enrollment in parallel
    const [course, alreadyEnrolled] = await Promise.all([
      this.courseRepository.findOne({
        where: {
          id: courseId,
          is_active: true,
          lessons: { is_active: true },
        },
        relations: ['lessons'],
        order: { lessons: { order: 'ASC' } },
      }),
      this.isEnrolled(courseId, userId),
    ]);

    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }

    if (alreadyEnrolled) {
      throw new BadRequestException('User is already enrolled in this course');
    }

    const enrollment = this.userCourseRepository.create({
      course: { id: courseId },
      user: { id: userId },
      progress: ProgressEnum.IN_PROGRESS,
    });

    const savedEnrollment = await this.userCourseRepository.save(enrollment);

    if (course.lessons?.length > 0) {
      await this.userLessonsService.enrollInMultipleLessons(
        course.lessons,
        userId,
      );
    }

    return savedEnrollment;
  }

  async updateProgress(
    courseId: number,
    userId: number,
    progress: ProgressEnum,
  ): Promise<UserCourse> {
    const enrollment = await this.getEnrollment(courseId, userId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    enrollment.progress = progress;
    return await this.userCourseRepository.save(enrollment);
  }

  async getUserCourses(userId: number): Promise<UserCourse[]> {
    return await this.userCourseRepository.find({
      where: { user: { id: userId } },
      relations: ['course', 'course.lessons'],
      order: { enrolled_at: 'DESC' },
    });
  }
}
