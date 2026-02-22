import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../entities/lesson.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
  ) {}

  async findAll(): Promise<Lesson[]> {
    return await this.lessonRepository.find({
      where: { is_active: true },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id, is_active: true },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${id} not found`);
    }

    return lesson;
  }

  async create(lessonData: Partial<Lesson>): Promise<Lesson> {
    const lesson = this.lessonRepository.create({
      ...lessonData,
      is_active: true,
    });
    return await this.lessonRepository.save(lesson);
  }

  async update(id: number, lessonData: Partial<Lesson>): Promise<Lesson> {
    const lesson = await this.findOne(id);
    Object.assign(lesson, lessonData);
    return await this.lessonRepository.save(lesson);
  }

  async remove(id: number): Promise<void> {
    const lesson = await this.findOne(id);
    lesson.is_active = false;
    await this.lessonRepository.save(lesson);
  }
}
