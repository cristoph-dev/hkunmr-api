import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async findAll(): Promise<Course[]> {
    return await this.courseRepository.find({
      where: { is_active: true },
      relations: ['lessons'],
      order: { position: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id, is_active: true },
      relations: ['lessons', 'lessons.steps'],
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
