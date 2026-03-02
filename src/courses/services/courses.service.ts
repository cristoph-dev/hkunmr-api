import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { UserCourse } from '../entities/course-user.entity';

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
