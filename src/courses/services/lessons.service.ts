import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Lesson } from '../entities/lesson.entity';
import { AdminLessonManagementResponseDto } from '../dto/response/admin-lesson-management-response.dto';
import { Course } from '../entities/course.entity';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { UserCourse } from '../entities/course-user.entity';
import { UserLesson } from '../entities/lesson-user.entity';
import { ProgressEnum } from 'src/common/lib/const';
import { ReorderLessonDto } from '../dto/reorder-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(UserCourse)
    private readonly userCourseRepository: Repository<UserCourse>,
    @InjectRepository(UserLesson)
    private readonly userLessonRepository: Repository<UserLesson>,
  ) {}

  private getLessonCourseColumnName(
    repository: Repository<Lesson>,
  ): string {
    const relation = repository.metadata.findRelationWithPropertyPath('course');
    return relation?.joinColumns?.[0]?.databaseName ?? 'course_id';
  }

  private async syncUserLessonsForLesson(
    lessonId: number,
    courseId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const userCourseRepository = manager
      ? manager.getRepository(UserCourse)
      : this.userCourseRepository;
    const userLessonRepository = manager
      ? manager.getRepository(UserLesson)
      : this.userLessonRepository;

    const [enrolledUsers, existingUserLessons] = await Promise.all([
      userCourseRepository.find({
        where: { course: { id: courseId } },
        select: { id: true },
      }),
      userLessonRepository.find({
        where: { lesson: { id: lessonId } },
        relations: ['course_user'],
      }),
    ]);

    const enrolledCourseUserIds = new Set(enrolledUsers.map((u) => u.id));
    const existingCourseUserIds = new Set(
      existingUserLessons.map((ul) => ul.course_user.id),
    );

    const toCreate = enrolledUsers
      .filter((enrollment) => !existingCourseUserIds.has(enrollment.id))
      .map((enrollment) =>
        userLessonRepository.create({
          course_user: { id: enrollment.id } as UserCourse,
          lesson: { id: lessonId } as Lesson,
          progress: ProgressEnum.NOT_STARTED,
        }),
      );

    const toDeleteIds = existingUserLessons
      .filter((ul) => !enrolledCourseUserIds.has(ul.course_user.id))
      .map((ul) => ul.id);

    if (toCreate.length > 0) {
      await userLessonRepository.save(toCreate);
    }

    if (toDeleteIds.length > 0) {
      await userLessonRepository.delete({ id: In(toDeleteIds) });
    }
  }

  private async rebalanceCourseProgressFrontier(
    courseId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const lessonRepository = manager
      ? manager.getRepository(Lesson)
      : this.lessonRepository;
    const userCourseRepository = manager
      ? manager.getRepository(UserCourse)
      : this.userCourseRepository;
    const userLessonRepository = manager
      ? manager.getRepository(UserLesson)
      : this.userLessonRepository;

    const lessons = await lessonRepository.find({
      where: { course: { id: courseId }, is_active: true },
      select: { id: true, order: true },
      order: { order: 'ASC' },
    });

    if (lessons.length === 0) {
      return;
    }

    const lessonIdsInOrder = lessons.map((l) => l.id);
    const enrollments = await userCourseRepository.find({
      where: { course: { id: courseId } },
      select: { id: true },
    });

    for (const enrollment of enrollments) {
      const userLessons = await userLessonRepository.find({
        where: {
          course_user: { id: enrollment.id },
          lesson: { id: In(lessonIdsInOrder) },
        },
        relations: ['lesson'],
      });

      const byLessonId = new Map<number, UserLesson>(
        userLessons.map((ul) => [ul.lesson.id, ul]),
      );

      const missing = lessonIdsInOrder
        .filter((lessonId) => !byLessonId.has(lessonId))
        .map((lessonId) =>
          userLessonRepository.create({
            course_user: { id: enrollment.id } as UserCourse,
            lesson: { id: lessonId } as Lesson,
            progress: ProgressEnum.NOT_STARTED,
          }),
        );

      if (missing.length > 0) {
        const created = await userLessonRepository.save(missing);
        created.forEach((ul) => byLessonId.set(ul.lesson.id, ul));
      }

      const firstNonCompleted = lessonIdsInOrder.find((lessonId) => {
        const ul = byLessonId.get(lessonId);
        return ul?.progress !== ProgressEnum.COMPLETED;
      });

      const toUpdate: UserLesson[] = [];

      for (const lessonId of lessonIdsInOrder) {
        const ul = byLessonId.get(lessonId);
        if (!ul) continue;

        if (ul.progress === ProgressEnum.COMPLETED) {
          continue;
        }

        const desired =
          lessonId === firstNonCompleted
            ? ProgressEnum.IN_PROGRESS
            : ProgressEnum.NOT_STARTED;

        if (ul.progress !== desired) {
          ul.progress = desired;
          toUpdate.push(ul);
        }
      }

      if (toUpdate.length > 0) {
        await userLessonRepository.save(toUpdate);
      }
    }
  }

  private async reorderLessonInTransaction(
    manager: EntityManager,
    lessonId: number,
    payload: ReorderLessonDto,
  ): Promise<Lesson> {
    const lessonRepository = manager.getRepository(Lesson);
    const courseRepository = manager.getRepository(Course);
    const courseColumn = this.getLessonCourseColumnName(lessonRepository);

    const lesson = await lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['course'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!lesson || !lesson.is_active) {
      throw new NotFoundException(`Lesson with id ${lessonId} not found`);
    }

    const sourceCourseId = lesson.course.id;
    const targetCourseId = payload.course_id ?? sourceCourseId;

    if (targetCourseId !== sourceCourseId) {
      const targetCourse = await courseRepository.findOne({
        where: { id: targetCourseId, is_active: true },
      });
      if (!targetCourse) {
        throw new NotFoundException(`Course with id ${targetCourseId} not found`);
      }
    }

    const targetLessonsCount = await lessonRepository
      .createQueryBuilder('lesson')
      .where('lesson.course = :courseId', { courseId: targetCourseId })
      .andWhere('lesson.is_active = :isActive', { isActive: true })
      .andWhere(targetCourseId === sourceCourseId ? 'lesson.id != :lessonId' : '1=1', {
        lessonId,
      })
      .getCount();

    const maxOrder = targetLessonsCount + 1;
    const newOrder = Math.min(Math.max(payload.order, 1), maxOrder);
    const oldOrder = lesson.order;

    await lessonRepository
      .createQueryBuilder()
      .update(Lesson)
      .set({ order: 0 })
      .where('id = :id', { id: lessonId })
      .execute();

    if (targetCourseId === sourceCourseId) {
      if (newOrder < oldOrder) {
        await lessonRepository
          .createQueryBuilder()
          .update(Lesson)
          .set({ order: () => '`order` + 1' })
          .where(`${courseColumn} = :courseId`, { courseId: sourceCourseId })
          .andWhere('is_active = :isActive', { isActive: true })
          .andWhere('`order` >= :newOrder AND `order` < :oldOrder', {
            newOrder,
            oldOrder,
          })
          .execute();
      } else if (newOrder > oldOrder) {
        await lessonRepository
          .createQueryBuilder()
          .update(Lesson)
          .set({ order: () => '`order` - 1' })
          .where(`${courseColumn} = :courseId`, { courseId: sourceCourseId })
          .andWhere('is_active = :isActive', { isActive: true })
          .andWhere('`order` <= :newOrder AND `order` > :oldOrder', {
            newOrder,
            oldOrder,
          })
          .execute();
      }
    } else {
      await lessonRepository
        .createQueryBuilder()
        .update(Lesson)
        .set({ order: () => '`order` - 1' })
        .where(`${courseColumn} = :sourceCourseId`, { sourceCourseId })
        .andWhere('is_active = :isActive', { isActive: true })
        .andWhere('`order` > :oldOrder', { oldOrder })
        .execute();

      await lessonRepository
        .createQueryBuilder()
        .update(Lesson)
        .set({ order: () => '`order` + 1' })
        .where(`${courseColumn} = :targetCourseId`, { targetCourseId })
        .andWhere('is_active = :isActive', { isActive: true })
        .andWhere('`order` >= :newOrder', { newOrder })
        .execute();
    }

    lesson.order = newOrder;
    lesson.course = { id: targetCourseId } as Course;
    await lessonRepository.save(lesson);

    await this.syncUserLessonsForLesson(lessonId, targetCourseId, manager);
    await this.rebalanceCourseProgressFrontier(targetCourseId, manager);
    if (sourceCourseId !== targetCourseId) {
      await this.rebalanceCourseProgressFrontier(sourceCourseId, manager);
    }

    const updated = await lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['course'],
    });

    if (!updated) {
      throw new NotFoundException(`Lesson with id ${lessonId} not found`);
    }

    return updated;
  }

  async findAll(): Promise<Lesson[]> {
    return await this.lessonRepository.find({
      where: { is_active: true },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id, is_active: true },
      relations: ['course'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${id} not found`);
    }

    return lesson;
  }

  async create(lessonData: CreateLessonDto): Promise<Lesson> {
    return await this.lessonRepository.manager.transaction(async (manager) => {
      const lessonRepository = manager.getRepository(Lesson);
      const courseRepository = manager.getRepository(Course);
      const courseColumn = this.getLessonCourseColumnName(lessonRepository);

      const course = await courseRepository.findOne({
        where: { id: lessonData.course_id, is_active: true },
      });

      if (!course) {
        throw new NotFoundException(
          `Course with id ${lessonData.course_id} not found`,
        );
      }

      const lessonsCount = await lessonRepository.count({
        where: {
          course: { id: lessonData.course_id },
          is_active: true,
        },
      });

      const targetOrder = Math.min(
        Math.max(lessonData.order, 1),
        lessonsCount + 1,
      );

      await lessonRepository
        .createQueryBuilder()
        .update(Lesson)
        .set({ order: () => '`order` + 1' })
        .where(`${courseColumn} = :courseId`, { courseId: lessonData.course_id })
        .andWhere('is_active = :isActive', { isActive: true })
        .andWhere('`order` >= :targetOrder', { targetOrder })
        .execute();

      const lesson = lessonRepository.create({
        title: lessonData.title,
        description: lessonData.description,
        order: targetOrder,
        course: { id: lessonData.course_id } as Course,
        is_active: true,
      });

      const savedLesson = await lessonRepository.save(lesson);
      await this.syncUserLessonsForLesson(
        savedLesson.id,
        lessonData.course_id,
        manager,
      );
      await this.rebalanceCourseProgressFrontier(lessonData.course_id, manager);

      return savedLesson;
    });
  }

  async update(id: number, lessonData: UpdateLessonDto): Promise<Lesson> {
    return await this.lessonRepository.manager.transaction(async (manager) => {
      const lessonRepository = manager.getRepository(Lesson);

      const hasReorderPayload =
        typeof lessonData.order === 'number' ||
        typeof lessonData.course_id === 'number';

      if (hasReorderPayload) {
        const currentLesson = await lessonRepository.findOne({
          where: { id, is_active: true },
          relations: ['course'],
        });

        if (!currentLesson) {
          throw new NotFoundException(`Lesson with id ${id} not found`);
        }

        await this.reorderLessonInTransaction(manager, id, {
          order: lessonData.order ?? currentLesson.order,
          course_id: lessonData.course_id,
        });
      }

      const lesson = await lessonRepository.findOne({
        where: { id, is_active: true },
        relations: ['course'],
      });

      if (!lesson) {
        throw new NotFoundException(`Lesson with id ${id} not found`);
      }

      if (typeof lessonData.title === 'string') {
        lesson.title = lessonData.title;
      }

      if (typeof lessonData.description === 'string') {
        lesson.description = lessonData.description;
      }

      if (typeof lessonData.is_active === 'boolean') {
        lesson.is_active = lessonData.is_active;
      }

      return await lessonRepository.save(lesson);
    });
  }

  async reorder(id: number, payload: ReorderLessonDto): Promise<Lesson> {
    return await this.lessonRepository.manager.transaction(async (manager) =>
      this.reorderLessonInTransaction(manager, id, payload),
    );
  }

  async remove(id: number): Promise<void> {
    const lesson = await this.findOne(id);
    lesson.is_active = false;
    await this.lessonRepository.save(lesson);
  }

  async getAdminLessonsManagement(
    search?: string,
    page = 1,
    limit = 20,
    isActive?: boolean,
    courseId?: number,
  ): Promise<AdminLessonManagementResponseDto> {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(limit, 100)
        : 20;

    const countQuery = this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoin('lesson.course', 'course');

    if (typeof isActive === 'boolean') {
      countQuery.andWhere('lesson.is_active = :isActive', { isActive });
    }

    if (Number.isFinite(courseId) && (courseId as number) > 0) {
      countQuery.andWhere('course.id = :courseId', { courseId });
    }

    if (search && search.trim().length > 0) {
      countQuery.andWhere(
        '(lesson.title LIKE :q OR lesson.description LIKE :q OR course.title LIKE :q)',
        { q: `%${search.trim()}%` },
      );
    }

    const total = await countQuery.getCount();

    const query = this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoin('lesson.course', 'course')
      .leftJoin('lesson.steps', 'step', 'step.is_active = :activeStep', {
        activeStep: true,
      })
      .select('lesson.id', 'id')
      .addSelect('lesson.title', 'title')
      .addSelect('lesson.description', 'description')
      .addSelect('lesson.order', 'order')
      .addSelect('lesson.is_active', 'is_active')
      .addSelect('course.id', 'course_id')
      .addSelect('course.title', 'course_title')
      .addSelect('COUNT(DISTINCT step.id)', 'steps_count')
      .groupBy('lesson.id')
      .addGroupBy('course.id')
      .orderBy('course.position', 'ASC')
      .addOrderBy('lesson.order', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    if (typeof isActive === 'boolean') {
      query.andWhere('lesson.is_active = :isActive', { isActive });
    }

    if (Number.isFinite(courseId) && (courseId as number) > 0) {
      query.andWhere('course.id = :courseId', { courseId });
    }

    if (search && search.trim().length > 0) {
      query.andWhere(
        '(lesson.title LIKE :q OR lesson.description LIKE :q OR course.title LIKE :q)',
        { q: `%${search.trim()}%` },
      );
    }

    const rawItems = await query.getRawMany();

    return {
      items: rawItems.map((row) => ({
        id: Number(row.id),
        title: row.title,
        description: row.description,
        order: Number(row.order),
        is_active: Boolean(Number(row.is_active)),
        course_id: Number(row.course_id),
        course_title: row.course_title,
        steps_count: Number(row.steps_count),
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }
}
