import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLesson } from '../entities/lesson-user.entity';
import { Lesson } from '../entities/lesson.entity';
import { ProgressEnum } from 'src/common/lib/const';

@Injectable()
export class UserLessonsService {
  constructor(
    @InjectRepository(UserLesson)
    private readonly userLessonRepository: Repository<UserLesson>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
  ) { }

  async isEnrolled(lessonId: number, userId: number): Promise<boolean> {
    const enrollment = await this.userLessonRepository.findOne({
      where: {
        lesson: { id: lessonId },
        course_user: { user: { id: userId } },
      },
    });

    return !!enrollment;
  }

  async getEnrollment(
    lessonId: number,
    userId: number,
  ): Promise<UserLesson | null> {
    return await this.userLessonRepository.findOne({
      where: {
        lesson: { id: lessonId },
        course_user: { user: { id: userId } },
      },
    });
  }

  async enroll(lessonId: number, userId: number): Promise<UserLesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId, is_active: true },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${lessonId} not found`);
    }

    if (await this.isEnrolled(lessonId, userId)) {
      throw new BadRequestException('User is already enrolled in this lesson');
    }

    const enrollment = this.userLessonRepository.create({
      lesson: { id: lessonId },
      course_user: { user: { id: userId } },
      progress: ProgressEnum.NOT_STARTED,
    });

    return await this.userLessonRepository.save(enrollment);
  }

  async enrollInMultipleLessons(
    lessons: Array<{ id: number; order: number }>,
    courseUserId: number,
  ): Promise<UserLesson[]> {
    const enrollments = lessons.map((lesson) =>
      this.userLessonRepository.create({
        lesson: { id: lesson.id },
        course_user: { id: courseUserId },
        progress:
          lesson.order === 1
            ? ProgressEnum.IN_PROGRESS
            : ProgressEnum.NOT_STARTED,
      }),
    );

    return await this.userLessonRepository.save(enrollments);
  }

  async updateProgress(
    lessonId: number,
    userId: number,
    progress: ProgressEnum,
  ): Promise<UserLesson> {
    const enrollment = await this.getEnrollment(lessonId, userId);

    if (!enrollment) {
      throw new NotFoundException('Lesson enrollment not found');
    }

    enrollment.progress = progress;
    return await this.userLessonRepository.save(enrollment);
  }

  async getUserLessons(id: number): Promise<UserLesson[]> {
    return await this.userLessonRepository.find({
      where: { course_user: { user: { id } } },
      order: { started_at: 'DESC' },
    });
  }
}
