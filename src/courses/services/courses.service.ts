import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { UserCourse } from '../entities/course-user.entity';
import { ProgressEnum } from 'src/common/lib/const';

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
}
