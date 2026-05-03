import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Course, CourseScope } from '../entities/course.entity';
import { UserCourse } from '../entities/course-user.entity';
import { ProgressEnum } from 'src/common/lib/const';
import { User } from 'src/users/entities';
import { Lesson } from '../entities/lesson.entity';
import { UserLesson } from '../entities/lesson-user.entity';
import { Classroom } from 'src/classroom/entities/classroom.entity';
import { AuthRole } from 'src/common/guards/role.guard';
import { AdminDashboardResponseDto } from '../dto/response/admin-dashboard-response.dto';
import { TeacherDashboardResponseDto } from '../dto/response/teacher-dashboard-response.dto';
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

interface CourseActor {
  id: number;
  roles: string[];
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

  private async getStudentVisibilityContext(userId: number): Promise<{
    classroomIds: number[];
    teacherIds: number[];
  }> {
    const classrooms = await this.classroomRepository
      .createQueryBuilder('classroom')
      .leftJoinAndSelect('classroom.teacher', 'teacher')
      .innerJoin('classroom.students', 'student', 'student.id = :userId', {
        userId,
      })
      .where('classroom.is_active = :isActive', { isActive: true })
      .getMany();

    const classroomIds = classrooms.map((item) => item.id);
    const teacherIds = Array.from(
      new Set(
        classrooms
          .map((item) => item.teacher?.id)
          .filter((id): id is number => Number.isFinite(id)),
      ),
    );

    return { classroomIds, teacherIds };
  }

  private applyStudentVisibilityFilter(
    query: SelectQueryBuilder<Course>,
    classroomIds: number[],
    teacherIds: number[],
  ): void {
    query.andWhere(
      new Brackets((scopeQb) => {
        scopeQb.where('course.scope = :nativeScope', {
          nativeScope: CourseScope.NATIVE,
        });

        if (teacherIds.length > 0) {
          scopeQb.orWhere('author.id IN (:...teacherIds)', { teacherIds });
        }

        if (classroomIds.length > 0) {
          scopeQb.orWhere(
            `EXISTS (
              SELECT 1
              FROM classroom_courses cc
              WHERE cc.course_id = course.id
              AND cc.classroom_id IN (:...classroomIds)
            )`,
            { classroomIds },
          );
        }
      }),
    );
  }

  async canUserAccessCourse(
    userId: number,
    courseId: number,
    userRoles: string[] = [],
  ): Promise<boolean> {
    const isTeacherOrAdmin =
      userRoles.includes(AuthRole.Teacher) || userRoles.includes(AuthRole.Admins);

    if (isTeacherOrAdmin) {
      return this.courseRepository.existsBy({ id: courseId, is_active: true });
    }

    const { classroomIds, teacherIds } = await this.getStudentVisibilityContext(userId);

    const query = this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.author', 'author')
      .where('course.id = :courseId', { courseId })
      .andWhere('course.is_active = :isActive', { isActive: true });

    this.applyStudentVisibilityFilter(query, classroomIds, teacherIds);

    const count = await query.getCount();
    return count > 0;
  }

  async findAll(cascade?: string, actor?: CourseActor): Promise<Course[]> {
    const query = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.author', 'author')
      .orderBy('course.position', 'ASC');

    if (cascade === 'full') {
      query
        .leftJoinAndSelect('course.lessons', 'lesson')
        .leftJoinAndSelect('lesson.steps', 'step')
        .addOrderBy('lesson.order', 'ASC')
        .addOrderBy('step.order', 'ASC');
    } else {
      query.leftJoinAndSelect('course.lessons', 'lesson');
    }

    if (actor?.roles.includes(AuthRole.Teacher)) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('course.scope = :nativeScope', {
            nativeScope: CourseScope.NATIVE,
          }).orWhere('author.id = :authorId', { authorId: actor.id });
        }),
      );
    }

    return await query.getMany();
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
    userRoles: string[] = [],
  ): Promise<UserCourseCatalogItem[]> {
    const isTeacherOrAdmin =
      userRoles.includes(AuthRole.Teacher) || userRoles.includes(AuthRole.Admins);

    let courses: Course[];
    if (isTeacherOrAdmin) {
      courses = await this.findAll(cascadeData ? 'full' : undefined, {
        id: userId,
        roles: userRoles,
      });
    } else {
      const { classroomIds, teacherIds } = await this.getStudentVisibilityContext(userId);

      const query = this.courseRepository
        .createQueryBuilder('course')
        .leftJoinAndSelect('course.author', 'author')
        .leftJoinAndSelect('course.lessons', 'lesson')
        .where('course.is_active = :isActive', { isActive: true })
        .orderBy('course.position', 'ASC')
        .addOrderBy('lesson.order', 'ASC');

      if (cascadeData) {
        query
          .leftJoinAndSelect('lesson.steps', 'step')
          .addOrderBy('step.order', 'ASC');
      }

      this.applyStudentVisibilityFilter(query, classroomIds, teacherIds);
      courses = await query.getMany();
    }

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
        is_unlocked: isTeacherOrAdmin || course.position === 1 || isEnrolled,
        progress: enrollment?.progress ?? null,
        enrollment_id: enrollment?.id ?? null,
        ...(cascadeData ? { user_lessons: enrollment?.user_lessons ?? [] } : {}),
      };
    });
  }

  async findOne(id: number, actor?: CourseActor): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: actor?.roles.includes(AuthRole.Admins) ? { id } : { id, is_active: true },
      relations: ['lessons', 'author'],
    });

    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    if (actor?.roles.includes(AuthRole.Teacher)) {
      const isVisibleForTeacher =
        course.scope === CourseScope.NATIVE || course.author?.id === actor.id;
      if (!isVisibleForTeacher) {
        throw new ForbiddenException('You are not allowed to access this course');
      }
    }

    return course;
  }

  async create(courseData: Partial<Course>, actor: CourseActor): Promise<Course> {
    const isTeacher = actor.roles.includes(AuthRole.Teacher);
    const isAdmin = actor.roles.includes(AuthRole.Admins);

    if (!isTeacher && !isAdmin) {
      throw new ForbiddenException('Only teachers/admins can create courses');
    }

    const scope = isAdmin ? CourseScope.NATIVE : CourseScope.TEACHER;
    const author = isTeacher ? ({ id: actor.id } as User) : null;

    const course = this.courseRepository.create({
      ...courseData,
      is_active: true,
      scope,
      author,
    });
    return await this.courseRepository.save(course);
  }

  async update(id: number, courseData: Partial<Course>, actor: CourseActor): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['lessons', 'author'],
    });
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    const isTeacher = actor.roles.includes(AuthRole.Teacher);
    const isAdmin = actor.roles.includes(AuthRole.Admins);
    const isOwnerTeacher = course.author?.id === actor.id;

    if (!isAdmin && (!isTeacher || !isOwnerTeacher || course.scope !== CourseScope.TEACHER)) {
      throw new ForbiddenException('You are not allowed to update this course');
    }

    if (isTeacher) {
      delete courseData.scope;
      delete courseData.author;
    }

    Object.assign(course, courseData);
    return await this.courseRepository.save(course);
  }

  async remove(id: number, actor: CourseActor): Promise<void> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    const isTeacher = actor.roles.includes(AuthRole.Teacher);
    const isAdmin = actor.roles.includes(AuthRole.Admins);
    const isOwnerTeacher = course.author?.id === actor.id;

    if (!isAdmin && (!isTeacher || !isOwnerTeacher || course.scope !== CourseScope.TEACHER)) {
      throw new ForbiddenException('You are not allowed to delete this course');
    }

    await this.courseRepository.manager.transaction(async (manager) => {
      const lessons = await manager.getRepository(Lesson).find({
        where: { course: { id } },
        select: { id: true },
      });

      const lessonIds = lessons.map((lesson) => lesson.id);
      if (lessonIds.length > 0) {
        await manager.getRepository(LessonStep).delete({
          lesson: { id: In(lessonIds) },
        });
      }

      await manager.getRepository(Lesson).delete({ course: { id } });
      await manager.query('DELETE FROM classroom_courses WHERE course_id = ?', [id]);
      await manager.getRepository(Course).delete({ id });
    });
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

  async getTeacherDashboardSummary(
    _teacherId: number,
  ): Promise<TeacherDashboardResponseDto> {
    const [
      studentsActive,
      coursesPublished,
      lessonsCompleted,
      classroomsActive,
      students,
      courses,
      lessons,
      lessonSteps,
    ] =
      await Promise.all([
        this.userRepository
          .createQueryBuilder('user')
          .innerJoin('user.roles', 'role')
          .where('user.is_active = :isActive', { isActive: true })
          .andWhere('role.is_active = :roleActive', { roleActive: true })
          .andWhere('role.description = :role', { role: AuthRole.Student })
          .getCount(),
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
          .andWhere('role.description = :role', { role: AuthRole.Student })
          .getCount(),
        this.courseRepository.count(),
        this.lessonRepository.count({ where: { is_active: true } }),
        this.lessonStepRepository.count({ where: { is_active: true } }),
      ]);

    return {
      students_active: studentsActive,
      courses_published: coursesPublished,
      lessons_completed: lessonsCompleted,
      classrooms_active: classroomsActive,
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
