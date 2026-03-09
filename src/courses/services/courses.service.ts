import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { UserCourse } from '../entities/course-user.entity';
import { ProgressEnum } from 'src/common/lib/const';
import { User } from 'src/users/entities';
import { Lesson } from '../entities/lesson.entity';
import { UserLesson } from '../entities/lesson-user.entity';
import { Classroom } from 'src/classroom/entities/classroom.entity';
import { AuthRole } from 'src/common/guards/role.guard';
import { AdminDashboardResponseDto } from '../dto/response/admin-dashboard-response.dto';
import { AdminCourseManagementResponseDto } from '../dto/response/admin-course-management-response.dto';
import { LessonStep } from '../entities/lesson-step.entity';

interface UserCourseCatalogItem {
  course: Course;
  is_enrolled: boolean;
  is_unlocked: boolean;
  progress: ProgressEnum | null;
  enrollment_id: number | null;
  user_lessons?: UserCourse['user_lessons'];
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(UserCourse)
    private readonly userCourseRepository: Repository<UserCourse>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(UserLesson)
    private readonly userLessonRepository: Repository<UserLesson>,
    @InjectRepository(LessonStep)
    private readonly lessonStepRepository: Repository<LessonStep>,
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) { }

  async findAll(cascade?: string): Promise<Course[]> {
    if (cascade === 'full') {
      return await this.courseRepository
        .createQueryBuilder('course')
        .leftJoinAndSelect('course.lessons', 'lesson')
        .leftJoinAndSelect('lesson.steps', 'step')
        .where('course.is_active = :active', { active: true })
        .orderBy('course.position', 'ASC')
        .addOrderBy('lesson.order', 'ASC')
        .addOrderBy('step.order', 'ASC')
        .getMany();
    }

    return await this.courseRepository.find({
      where: { is_active: true },
      relations: ['lessons'],
      order: {
        position: 'ASC',
      },
    });
  }

  async findByUserId(id: number, cascadeData: boolean = false): Promise<UserCourse[]> {
    const relations = ['course'];
    if (Boolean(cascadeData)) {
      relations.push('user_lessons', 'user_lessons.user_steps', 'user_lessons.lesson');
    }

    return await this.userCourseRepository.find({
      where: { user: { id } },
      relations,
    });
  }

  async findCatalogByUserId(
    userId: number,
    cascadeData: boolean = false,
  ): Promise<UserCourseCatalogItem[]> {
    const courses = await this.findAll(cascadeData ? 'full' : undefined);

    const enrollmentRelations = ['course'];
    if (cascadeData) {
      enrollmentRelations.push(
        'user_lessons',
        'user_lessons.user_steps',
        'user_lessons.lesson',
      );
    }

    const enrollments = await this.userCourseRepository.find({
      where: { user: { id: userId } },
      relations: enrollmentRelations,
    });

    const enrollmentByCourseId = new Map<number, UserCourse>(
      enrollments.map((enrollment) => [enrollment.course.id, enrollment]),
    );

    return courses.map((course) => {
      const enrollment = enrollmentByCourseId.get(course.id);
      const isEnrolled = Boolean(enrollment);

      return {
        course,
        is_enrolled: isEnrolled,
        is_unlocked: course.position === 1 || isEnrolled,
        progress: enrollment?.progress ?? null,
        enrollment_id: enrollment?.id ?? null,
        ...(cascadeData ? { user_lessons: enrollment?.user_lessons ?? [] } : {}),
      };
    });
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id, is_active: true },
      relations: ['lessons'],
    });

    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    return course;
  }

  async create(courseData: Partial<Course>): Promise<Course> {
    const course = this.courseRepository.create({
      ...courseData,
      is_active: true,
    });
    return await this.courseRepository.save(course);
  }

  async update(id: number, courseData: Partial<Course>): Promise<Course> {
    const course = await this.findOne(id);
    Object.assign(course, courseData);
    return await this.courseRepository.save(course);
  }

  async remove(id: number): Promise<void> {
    const course = await this.findOne(id);
    course.is_active = false;
    await this.courseRepository.save(course);
  }

  async getAdminDashboardSummary(): Promise<AdminDashboardResponseDto> {
    const [
      usersActive,
      coursesPublished,
      lessonsCompleted,
      classroomsActive,
      teachers,
      students,
      courses,
      lessons,
      lessonSteps,
    ] = await Promise.all([
      this.userRepository.count({ where: { is_active: true } }),
      this.courseRepository.count({ where: { is_active: true } }),
      this.userLessonRepository.count({
        where: { progress: ProgressEnum.COMPLETED },
      }),
      this.classroomRepository.count({ where: { is_active: true } }),
      this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('user.is_active = :isActive', { isActive: true })
        .andWhere('role.is_active = :roleActive', { roleActive: true })
        .andWhere('role.description = :role', { role: AuthRole.Teacher })
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('user.is_active = :isActive', { isActive: true })
        .andWhere('role.is_active = :roleActive', { roleActive: true })
        .andWhere('role.description = :role', { role: AuthRole.Student })
        .getCount(),
      this.courseRepository.count(),
      this.lessonRepository.count({ where: { is_active: true } }),
      this.lessonStepRepository.count({ where: { is_active: true } }),
    ]);

    return {
      users_active: usersActive,
      courses_published: coursesPublished,
      lessons_completed: lessonsCompleted,
      classrooms_active: classroomsActive,
      teachers,
      students,
      courses,
      lessons,
      lesson_steps: lessonSteps,
    };
  }

  async getAdminCoursesManagement(
    search?: string,
    page = 1,
    limit = 20,
    isActive?: boolean,
  ): Promise<AdminCourseManagementResponseDto> {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(limit, 100)
        : 20;

    const countQuery = this.courseRepository.createQueryBuilder('course');
    if (typeof isActive === 'boolean') {
      countQuery.andWhere('course.is_active = :isActive', { isActive });
    }
    if (search && search.trim().length > 0) {
      countQuery.andWhere('course.title LIKE :q', { q: `%${search.trim()}%` });
    }

    const total = await countQuery.getCount();

    const query = this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.lessons', 'lesson', 'lesson.is_active = :activeLesson', {
        activeLesson: true,
      })
      .leftJoin('course.users', 'userCourse')
      .leftJoin('userCourse.user', 'user', 'user.is_active = :activeUser', {
        activeUser: true,
      })
      .select('course.id', 'id')
      .addSelect('course.title', 'title')
      .addSelect('course.is_active', 'is_active')
      .addSelect('course.position', 'position')
      .addSelect('COUNT(DISTINCT lesson.id)', 'lessons_count')
      .addSelect('COUNT(DISTINCT user.id)', 'enrolled_users_count')
      .groupBy('course.id')
      .orderBy('course.position', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    if (typeof isActive === 'boolean') {
      query.andWhere('course.is_active = :isActive', { isActive });
    }

    if (search && search.trim().length > 0) {
      query.andWhere('course.title LIKE :q', { q: `%${search.trim()}%` });
    }

    const rawItems = await query.getRawMany();

    return {
      items: rawItems.map((row) => ({
        id: Number(row.id),
        title: row.title,
        is_active: Boolean(Number(row.is_active)),
        position: Number(row.position),
        lessons_count: Number(row.lessons_count),
        enrolled_users_count: Number(row.enrolled_users_count),
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }
}
