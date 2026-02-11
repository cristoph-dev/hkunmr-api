import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonStep } from '../entities/lesson-step.entity';

@Injectable()
export class LessonStepsService {
  constructor(
    @InjectRepository(LessonStep)
    private readonly lessonStepRepository: Repository<LessonStep>,
  ) {}

  async findAll(): Promise<LessonStep[]> {
    return await this.lessonStepRepository.find({
      where: { is_active: true },
      relations: ['type'],
      order: { order: 'ASC' },
    });
  }

  async findOne(id: number): Promise<LessonStep> {
    const lessonStep = await this.lessonStepRepository.findOne({
      where: { id, is_active: true },
      relations: ['lesson', 'type'],
    });

    if (!lessonStep) {
      throw new NotFoundException(`Lesson step with id ${id} not found`);
    }

    return lessonStep;
  }

  async create(lessonStepData: Partial<LessonStep>): Promise<LessonStep> {
    const lessonStep = this.lessonStepRepository.create({
      ...lessonStepData,
      is_active: true,
    });
    return await this.lessonStepRepository.save(lessonStep);
  }

  async update(
    id: number,
    lessonStepData: Partial<LessonStep>,
  ): Promise<LessonStep> {
    const lessonStep = await this.findOne(id);
    Object.assign(lessonStep, lessonStepData);
    return await this.lessonStepRepository.save(lessonStep);
  }

  async remove(id: number): Promise<void> {
    const lessonStep = await this.findOne(id);
    lessonStep.is_active = false;
    await this.lessonStepRepository.save(lessonStep);
  }
}
