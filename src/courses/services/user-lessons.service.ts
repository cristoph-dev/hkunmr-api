import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { UserLesson } from '../entities/lesson-user.entity';
import { Lesson } from '../entities/lesson.entity';
import { ProgressEnum } from 'src/common/lib/const';
import { UserCourse } from '../entities/course-user.entity';
import { LessonStep } from '../entities/lesson-step.entity';
import { UserStep } from '../entities/lesson-step-user.entity';
import { SubmitStepAnswerDto } from '../dto/submit-step-answer.dto';

interface SubmitStepAnswerResponse {
  lesson_id: number;
  step_id: number;
  is_correct: boolean;
  is_answered: boolean;
  attempts_count: number;
  medals_earned: number;
  awarded_medals: number;
  remaining_medal_tier: number;
  lesson_progress: ProgressEnum;
}

@Injectable()
export class UserLessonsService {
  constructor(
    @InjectRepository(UserLesson)
    private readonly userLessonRepository: Repository<UserLesson>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(UserCourse)
    private readonly userCourseRepository: Repository<UserCourse>,
    @InjectRepository(LessonStep)
    private readonly lessonStepRepository: Repository<LessonStep>,
    @InjectRepository(UserStep)
    private readonly userStepRepository: Repository<UserStep>,
  ) { }

  private normalizeText(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private parseJsonArray(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item) => this.normalizeText(String(item)));
    } catch {
      return [];
    }
  }

  private areStringSetsEqual(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    const sortedLeft = [...left].sort();
    const sortedRight = [...right].sort();
    return sortedLeft.every((item, index) => item === sortedRight[index]);
  }

  private areStringArraysEqual(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((item, index) => item === right[index]);
  }

  private medalsForAttempts(attempts: number): number {
    if (attempts <= 1) {
      return 3;
    }
    if (attempts === 2) {
      return 2;
    }
    if (attempts === 3) {
      return 1;
    }
    return 0;
  }

  private evaluateAnswer(
    step: LessonStep,
    payload: SubmitStepAnswerDto,
  ): { isCorrect: boolean; serializedAnswer: string | null; isEvaluable: boolean } {
    const stepTypeCode = step.lessonStepType?.code ?? '';
    const rawAnswer = typeof payload.answer === 'string' ? payload.answer : '';
    const rawAnswers = Array.isArray(payload.answers) ? payload.answers : [];

    if (stepTypeCode === 'THEORY' || stepTypeCode === 'COMPLETION') {
      return {
        isCorrect: true,
        serializedAnswer: null,
        isEvaluable: false,
      };
    }

    const expected = this.normalizeText(step.solution ?? '');
    const normalizedAnswer = this.normalizeText(rawAnswer);

    if (
      stepTypeCode === 'SINGLE_CHOICE' ||
      stepTypeCode === 'TRUE_FALSE' ||
      stepTypeCode === 'CODE_COMPLETE' ||
      stepTypeCode === 'CODE_COMPLETE_TYPED'
    ) {
      if (!normalizedAnswer) {
        throw new BadRequestException('Answer is required for this step type');
      }

      return {
        isCorrect: normalizedAnswer === expected,
        serializedAnswer: rawAnswer,
        isEvaluable: true,
      };
    }

    if (stepTypeCode === 'MULTIPLE_CHOICE') {
      if (!rawAnswers.length) {
        throw new BadRequestException('Answers are required for this step type');
      }

      const normalizedAnswers = rawAnswers.map((value) =>
        this.normalizeText(String(value)),
      );
      const expectedSet = this.parseJsonArray(step.solution ?? '[]');

      return {
        isCorrect: this.areStringSetsEqual(normalizedAnswers, expectedSet),
        serializedAnswer: JSON.stringify(rawAnswers),
        isEvaluable: true,
      };
    }

    if (stepTypeCode === 'THEORY_COMPLETE') {
      if (!rawAnswers.length) {
        throw new BadRequestException('Answers are required for this step type');
      }

      const normalizedAnswers = rawAnswers.map((value) =>
        this.normalizeText(String(value)),
      );
      const expectedSequence = this.parseJsonArray(step.solution ?? '[]');

      return {
        isCorrect: this.areStringArraysEqual(
          normalizedAnswers,
          expectedSequence,
        ),
        serializedAnswer: JSON.stringify(rawAnswers),
        isEvaluable: true,
      };
    }

    throw new BadRequestException(`Unsupported step type: ${stepTypeCode}`);
  }

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

  async submitStepAnswer(
    lessonId: number,
    stepId: number,
    userId: number,
    payload: SubmitStepAnswerDto,
  ): Promise<SubmitStepAnswerResponse> {
    return await this.userLessonRepository.manager.transaction(
      async (manager) => {
        const userLessonRepository = manager.getRepository(UserLesson);
        const lessonStepRepository = manager.getRepository(LessonStep);
        const userStepRepository = manager.getRepository(UserStep);

        const enrollment = await userLessonRepository.findOne({
          where: {
            lesson: { id: lessonId },
            course_user: { user: { id: userId } },
          },
          relations: ['lesson', 'course_user', 'course_user.course'],
        });

        if (!enrollment) {
          throw new NotFoundException('Lesson enrollment not found');
        }

        const step = await lessonStepRepository.findOne({
          where: {
            id: stepId,
            lesson: { id: lessonId },
            is_active: true,
          },
          relations: ['lessonStepType'],
        });

        if (!step) {
          throw new NotFoundException('Lesson step not found in this lesson');
        }

        let userStep = await userStepRepository.findOne({
          where: {
            user_lesson: { id: enrollment.id },
            step: { id: step.id },
          },
        });

        if (!userStep) {
          userStep = userStepRepository.create({
            user_lesson: { id: enrollment.id },
            step: { id: step.id },
            progress: ProgressEnum.IN_PROGRESS,
            is_answered: false,
            attempts_count: 0,
            medals_earned: 0,
          });
        }

        if (userStep.is_answered && userStep.progress === ProgressEnum.COMPLETED) {
          return {
            lesson_id: lessonId,
            step_id: stepId,
            is_correct: Boolean(userStep.is_correct),
            is_answered: true,
            attempts_count: userStep.attempts_count,
            medals_earned: userStep.medals_earned,
            awarded_medals: 0,
            remaining_medal_tier: 0,
            lesson_progress: enrollment.progress,
          };
        }

        const evaluation = this.evaluateAnswer(step, payload);
        const attempts = userStep.attempts_count + 1;
        const medals = evaluation.isCorrect && evaluation.isEvaluable
          ? this.medalsForAttempts(attempts)
          : 0;

        userStep.answer = evaluation.serializedAnswer ?? null;
        userStep.is_correct = evaluation.isCorrect;
        userStep.attempts_count = attempts;
        userStep.is_answered = evaluation.isCorrect;
        userStep.progress = evaluation.isCorrect
          ? ProgressEnum.COMPLETED
          : ProgressEnum.IN_PROGRESS;
        userStep.medals_earned = evaluation.isCorrect ? medals : 0;

        await userStepRepository.save(userStep);

        const activeStepsCount = await lessonStepRepository.count({
          where: {
            lesson: { id: lessonId },
            is_active: true,
          },
        });

        const completedUserStepsCount = await userStepRepository.count({
          where: {
            user_lesson: { id: enrollment.id },
            progress: ProgressEnum.COMPLETED,
          },
        });

        const desiredLessonProgress =
          activeStepsCount > 0 && completedUserStepsCount >= activeStepsCount
            ? ProgressEnum.COMPLETED
            : ProgressEnum.IN_PROGRESS;

        if (enrollment.progress !== desiredLessonProgress) {
          enrollment.progress = desiredLessonProgress;
          await userLessonRepository.save(enrollment);
        }

        return {
          lesson_id: lessonId,
          step_id: stepId,
          is_correct: evaluation.isCorrect,
          is_answered: userStep.is_answered,
          attempts_count: userStep.attempts_count,
          medals_earned: userStep.medals_earned,
          awarded_medals: medals,
          remaining_medal_tier: evaluation.isCorrect
            ? 0
            : this.medalsForAttempts(attempts + 1),
          lesson_progress: enrollment.progress,
        };
      },
    );
  }

  async getUserLessons(id: number): Promise<UserLesson[]> {
    return await this.userLessonRepository.find({
      where: { course_user: { user: { id } } },
      order: { started_at: 'DESC' },
    });
  }

  async completeLessonAndAdvance(
    lessonId: number,
    userId: number,
  ): Promise<UserLesson> {
    return await this.userLessonRepository.manager.transaction(
      async (manager) => {
        const userLessonRepository = manager.getRepository(UserLesson);
        const lessonRepository = manager.getRepository(Lesson);
        const userCourseRepository = manager.getRepository(UserCourse);

        const enrollment = await userLessonRepository.findOne({
          where: {
            lesson: { id: lessonId },
            course_user: { user: { id: userId } },
          },
          relations: ['lesson', 'course_user', 'course_user.course'],
        });

        if (!enrollment) {
          throw new NotFoundException('Lesson enrollment not found');
        }

        enrollment.progress = ProgressEnum.COMPLETED;
        await userLessonRepository.save(enrollment);

        const nextLesson = await lessonRepository.findOne({
          where: {
            course: { id: enrollment.course_user.course.id },
            is_active: true,
            order: MoreThan(enrollment.lesson.order),
          },
          order: { order: 'ASC' },
        });

        if (nextLesson) {
          const nextEnrollment = await userLessonRepository.findOne({
            where: {
              course_user: { id: enrollment.course_user.id },
              lesson: { id: nextLesson.id },
            },
          });

          if (
            nextEnrollment &&
            nextEnrollment.progress === ProgressEnum.NOT_STARTED
          ) {
            nextEnrollment.progress = ProgressEnum.IN_PROGRESS;
            await userLessonRepository.save(nextEnrollment);
          }

          if (enrollment.course_user.progress !== ProgressEnum.IN_PROGRESS) {
            enrollment.course_user.progress = ProgressEnum.IN_PROGRESS;
            await userCourseRepository.save(enrollment.course_user);
          }
        } else {
          enrollment.course_user.progress = ProgressEnum.COMPLETED;
          await userCourseRepository.save(enrollment.course_user);
        }

        const updatedEnrollment = await userLessonRepository.findOne({
          where: { id: enrollment.id },
          relations: ['lesson', 'course_user'],
        });

        if (!updatedEnrollment) {
          throw new NotFoundException('Updated lesson enrollment not found');
        }

        return updatedEnrollment;
      },
    );
  }
}
