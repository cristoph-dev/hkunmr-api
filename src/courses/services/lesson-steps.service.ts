import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LessonStep } from '../entities/lesson-step.entity';
import { AdminLessonStepManagementResponseDto } from '../dto/response/admin-lesson-step-management-response.dto';
import { Lesson } from '../entities/lesson.entity';
import { LessonStepType } from '../entities/lesson-step-type.entity';
import { CreateLessonStepDto } from '../dto/create-lesson-step.dto';
import { UpdateLessonStepDto } from '../dto/update-lesson-step.dto';

@Injectable()
export class LessonStepsService {
  constructor(
    @InjectRepository(LessonStep)
    private readonly lessonStepRepository: Repository<LessonStep>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonStepType)
    private readonly lessonStepTypeRepository: Repository<LessonStepType>,
  ) {}

  private static readonly ORDER_SHIFT_BUFFER = 100000;

  private parseSolutionArray(solutionRaw: string): string[] {
    try {
      const parsed = JSON.parse(solutionRaw);
      if (!Array.isArray(parsed)) {
        throw new BadRequestException(
          'THEORY_COMPLETE requires solution as a JSON array',
        );
      }

      const values = parsed.map((item) => String(item).trim());
      if (values.some((v) => v.length === 0)) {
        throw new BadRequestException(
          'THEORY_COMPLETE solution values cannot be empty',
        );
      }
      return values;
    } catch {
      throw new BadRequestException(
        'THEORY_COMPLETE requires solution as a valid JSON array',
      );
    }
  }

  private validateTheoryCompletePayload(
    prompt: string,
    solutionRaw: string,
    options: string[],
  ): void {
    const matches = [...prompt.matchAll(/{{\s*gap(\d+)\s*}}/gi)];
    if (matches.length === 0) {
      throw new BadRequestException(
        'THEORY_COMPLETE prompt must include placeholders like {{gap1}}',
      );
    }

    const indexes = matches.map((m) => Number(m[1]));
    const unique = [...new Set(indexes)].sort((a, b) => a - b);

    if (unique.length !== indexes.length) {
      throw new BadRequestException(
        'THEORY_COMPLETE prompt contains duplicated placeholders',
      );
    }

    const isContinuous = unique.every((value, i) => value === i + 1);
    if (!isContinuous) {
      throw new BadRequestException(
        'THEORY_COMPLETE placeholders must be continuous: {{gap1}}..{{gapN}}',
      );
    }

    const solutions = this.parseSolutionArray(solutionRaw);

    if (solutions.length !== unique.length) {
      throw new BadRequestException(
        'THEORY_COMPLETE placeholders count must match solution length',
      );
    }

    if (!Array.isArray(options) || options.length === 0) {
      throw new BadRequestException(
        'THEORY_COMPLETE requires at least one option',
      );
    }

    const normalizedOptions = options.map((o) => String(o).trim());
    const missing = solutions.filter((s) => !normalizedOptions.includes(s));
    if (missing.length > 0) {
      throw new BadRequestException(
        `THEORY_COMPLETE solution values missing in options: ${missing.join(', ')}`,
      );
    }
  }

  private normalizeGapPlaceholders(prompt: string): string {
    return String(prompt ?? '').replace(
      /\{\s*gap(\d+)\s*\}|\{\{\s*gap(\d+)\s*\}\}/gi,
      (_match, single, double) => {
        const index = Number(single ?? double);
        return `{{gap${index}}}`;
      },
    );
  }

  private parseGapIndexes(prompt: string): number[] {
    return [...prompt.matchAll(/{{\s*gap(\d+)\s*}}/gi)].map((m) =>
      Number(m[1]),
    );
  }

  private validateCodeCompletePayload(
    promptRaw: string,
    solutionRaw: string,
    options: string[],
    typed: boolean,
  ): void {
    const prompt = this.normalizeGapPlaceholders(promptRaw);
    const indexes = this.parseGapIndexes(prompt);

    if (indexes.length === 0) {
      throw new BadRequestException(
        `${typed ? 'CODE_COMPLETE_TYPED' : 'CODE_COMPLETE'} prompt must include {{gap1}}`,
      );
    }

    const unique = [...new Set(indexes)].sort((a, b) => a - b);
    if (unique.length !== indexes.length) {
      throw new BadRequestException(
        `${typed ? 'CODE_COMPLETE_TYPED' : 'CODE_COMPLETE'} prompt contains duplicated placeholders`,
      );
    }

    const isContinuous = unique.every((value, i) => value === i + 1);
    if (!isContinuous) {
      throw new BadRequestException(
        `${typed ? 'CODE_COMPLETE_TYPED' : 'CODE_COMPLETE'} placeholders must be continuous: {{gap1}}..{{gapN}}`,
      );
    }

    if (unique.length !== 1) {
      throw new BadRequestException(
        `${typed ? 'CODE_COMPLETE_TYPED' : 'CODE_COMPLETE'} currently supports exactly one placeholder ({{gap1}})`,
      );
    }

    const normalizedSolution = String(solutionRaw ?? '').trim();
    if (!normalizedSolution) {
      throw new BadRequestException(
        `${typed ? 'CODE_COMPLETE_TYPED' : 'CODE_COMPLETE'} requires a non-empty solution`,
      );
    }

    const normalizedOptions = Array.isArray(options)
      ? options.map((o) => String(o).trim()).filter((o) => o.length > 0)
      : [];

    if (!typed) {
      if (normalizedOptions.length < 2) {
        throw new BadRequestException(
          'CODE_COMPLETE requires at least 2 options',
        );
      }

      if (!normalizedOptions.includes(normalizedSolution)) {
        throw new BadRequestException(
          'CODE_COMPLETE solution must be present in options',
        );
      }
    } else if (
      normalizedOptions.length > 0 &&
      !normalizedOptions.includes(normalizedSolution)
    ) {
      throw new BadRequestException(
        'CODE_COMPLETE_TYPED solution must be present in options when options are provided',
      );
    }
  }

  private getLessonStepLessonColumnName(
    repository: Repository<LessonStep>,
  ): string {
    const relation = repository.metadata.findRelationWithPropertyPath('lesson');
    return relation?.joinColumns?.[0]?.databaseName ?? 'lesson_id';
  }

  private async reorderStepInTransaction(
    manager: EntityManager,
    stepId: number,
    lessonId: number,
    targetOrder: number,
  ): Promise<void> {
    const stepRepository = manager.getRepository(LessonStep);
    const lessonColumn = this.getLessonStepLessonColumnName(stepRepository);

    const step = await stepRepository.findOne({
      where: { id: stepId, is_active: true },
      relations: ['lesson'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!step) {
      throw new NotFoundException(`Lesson step with id ${stepId} not found`);
    }

    const sourceLessonId = step.lesson.id;
    const oldOrder = step.order;

    const siblingCount = await stepRepository
      .createQueryBuilder('step')
      .where('step.lesson = :lessonId', { lessonId })
      .andWhere('step.is_active = :isActive', { isActive: true })
      .andWhere(lessonId === sourceLessonId ? 'step.id != :stepId' : '1=1', {
        stepId,
      })
      .getCount();

    const newOrder = Math.min(Math.max(targetOrder, 1), siblingCount + 1);

    await stepRepository
      .createQueryBuilder()
      .update(LessonStep)
      .set({ order: 0 })
      .where('id = :id', { id: stepId })
      .execute();

    if (lessonId === sourceLessonId) {
      if (newOrder < oldOrder) {
        await stepRepository
          .createQueryBuilder()
          .update(LessonStep)
          .set({ order: () => `\`order\` + ${LessonStepsService.ORDER_SHIFT_BUFFER}` })
          .where(`${lessonColumn} = :lessonId`, { lessonId })
          .andWhere('is_active = :isActive', { isActive: true })
          .andWhere('`order` >= :newOrder AND `order` < :oldOrder', {
            newOrder,
            oldOrder,
          })
          .execute();
        await stepRepository
          .createQueryBuilder()
          .update(LessonStep)
          .set({ order: () => `\`order\` - ${LessonStepsService.ORDER_SHIFT_BUFFER - 1}` })
          .where(`${lessonColumn} = :lessonId`, { lessonId })
          .andWhere('is_active = :isActive', { isActive: true })
          .andWhere('`order` >= :buffer', { buffer: LessonStepsService.ORDER_SHIFT_BUFFER })
          .execute();
      } else if (newOrder > oldOrder) {
        await stepRepository
          .createQueryBuilder()
          .update(LessonStep)
          .set({ order: () => `\`order\` + ${LessonStepsService.ORDER_SHIFT_BUFFER}` })
          .where(`${lessonColumn} = :lessonId`, { lessonId: sourceLessonId })
          .andWhere('is_active = :isActive', { isActive: true })
          .andWhere('`order` <= :newOrder AND `order` > :oldOrder', {
            newOrder,
            oldOrder,
          })
          .execute();
        await stepRepository
          .createQueryBuilder()
          .update(LessonStep)
          .set({ order: () => `\`order\` - ${LessonStepsService.ORDER_SHIFT_BUFFER + 1}` })
          .where(`${lessonColumn} = :lessonId`, { lessonId: sourceLessonId })
          .andWhere('is_active = :isActive', { isActive: true })
          .andWhere('`order` >= :buffer', { buffer: LessonStepsService.ORDER_SHIFT_BUFFER })
          .execute();
      }
    } else {
      await stepRepository
        .createQueryBuilder()
        .update(LessonStep)
        .set({ order: () => `\`order\` + ${LessonStepsService.ORDER_SHIFT_BUFFER}` })
        .where(`${lessonColumn} = :sourceLessonId`, { sourceLessonId })
        .andWhere('is_active = :isActive', { isActive: true })
        .andWhere('`order` > :oldOrder', { oldOrder })
        .execute();
      await stepRepository
        .createQueryBuilder()
        .update(LessonStep)
        .set({ order: () => `\`order\` - ${LessonStepsService.ORDER_SHIFT_BUFFER + 1}` })
        .where(`${lessonColumn} = :sourceLessonId`, { sourceLessonId })
        .andWhere('is_active = :isActive', { isActive: true })
        .andWhere('`order` >= :buffer', { buffer: LessonStepsService.ORDER_SHIFT_BUFFER })
        .execute();

      await stepRepository
        .createQueryBuilder()
        .update(LessonStep)
        .set({ order: () => `\`order\` + ${LessonStepsService.ORDER_SHIFT_BUFFER}` })
        .where(`${lessonColumn} = :targetLessonId`, { targetLessonId: lessonId })
        .andWhere('is_active = :isActive', { isActive: true })
        .andWhere('`order` >= :newOrder', { newOrder })
        .execute();
      await stepRepository
        .createQueryBuilder()
        .update(LessonStep)
        .set({ order: () => `\`order\` - ${LessonStepsService.ORDER_SHIFT_BUFFER - 1}` })
        .where(`${lessonColumn} = :targetLessonId`, { targetLessonId: lessonId })
        .andWhere('is_active = :isActive', { isActive: true })
        .andWhere('`order` >= :buffer', { buffer: LessonStepsService.ORDER_SHIFT_BUFFER })
        .execute();
    }

    step.order = newOrder;
    step.lesson = { id: lessonId } as Lesson;
    await stepRepository.save(step);
  }

  async findAll(): Promise<LessonStep[]> {
    return await this.lessonStepRepository.find({
      where: { is_active: true },
      relations: ['lessonStepType'],  
      order: { order: 'ASC' },
    });
  }

  async findOne(id: number, includeInactive = false): Promise<LessonStep> {
    const lessonStep = await this.lessonStepRepository.findOne({
      where: includeInactive ? { id } : { id, is_active: true },
      relations: ['lesson', 'lessonStepType'],
    });

    if (!lessonStep) {
      throw new NotFoundException(`Lesson step with id ${id} not found`);
    }

    return lessonStep;
  }

  async create(lessonStepData: CreateLessonStepDto): Promise<LessonStep> {
    return await this.lessonStepRepository.manager.transaction(async (manager) => {
      const stepRepository = manager.getRepository(LessonStep);
      const lessonRepository = manager.getRepository(Lesson);
      const stepTypeRepository = manager.getRepository(LessonStepType);
      const lessonColumn = this.getLessonStepLessonColumnName(stepRepository);

      const lesson = await lessonRepository.findOne({
        where: { id: lessonStepData.lesson_id, is_active: true },
        relations: ['course'],
      });

      if (!lesson) {
        throw new NotFoundException(
          `Lesson with id ${lessonStepData.lesson_id} not found`,
        );
      }

      if (
        typeof lessonStepData.course_id === 'number' &&
        lesson.course.id !== lessonStepData.course_id
      ) {
        throw new NotFoundException(
          `Lesson ${lessonStepData.lesson_id} does not belong to course ${lessonStepData.course_id}`,
        );
      }

      const stepType = await stepTypeRepository.findOne({
        where: { code: lessonStepData.step_type_code },
      });

      if (!stepType) {
        throw new NotFoundException(
          `Lesson step type ${lessonStepData.step_type_code} not found`,
        );
      }

      const createPrompt = this.normalizeGapPlaceholders(
        lessonStepData.prompt ?? '',
      );
      const createSolution = lessonStepData.solution ?? '';
      const createOptions = lessonStepData.options ?? [];

      if (stepType.code === 'THEORY_COMPLETE') {
        this.validateTheoryCompletePayload(
          createPrompt,
          createSolution,
          createOptions,
        );
      }

      if (stepType.code === 'CODE_COMPLETE') {
        this.validateCodeCompletePayload(
          createPrompt,
          createSolution,
          createOptions,
          false,
        );
      }

      if (stepType.code === 'CODE_COMPLETE_TYPED') {
        this.validateCodeCompletePayload(
          createPrompt,
          createSolution,
          createOptions,
          true,
        );
      }

      const siblingsCount = await stepRepository.count({
        where: { lesson: { id: lessonStepData.lesson_id }, is_active: true },
      });
      const targetOrder = Math.min(
        Math.max(lessonStepData.order, 1),
        siblingsCount + 1,
      );

      await stepRepository
        .createQueryBuilder()
        .update(LessonStep)
        .set({ order: () => `\`order\` + ${LessonStepsService.ORDER_SHIFT_BUFFER}` })
        .where(`${lessonColumn} = :lessonId`, { lessonId: lessonStepData.lesson_id })
        .andWhere('is_active = :isActive', { isActive: true })
        .andWhere('`order` >= :targetOrder', { targetOrder })
        .execute();
      await stepRepository
        .createQueryBuilder()
        .update(LessonStep)
        .set({ order: () => `\`order\` - ${LessonStepsService.ORDER_SHIFT_BUFFER - 1}` })
        .where(`${lessonColumn} = :lessonId`, { lessonId: lessonStepData.lesson_id })
        .andWhere('is_active = :isActive', { isActive: true })
        .andWhere('`order` >= :buffer', { buffer: LessonStepsService.ORDER_SHIFT_BUFFER })
        .execute();

      const step = stepRepository.create({
        title: lessonStepData.title,
        description: lessonStepData.description,
        order: targetOrder,
        prompt: createPrompt,
        solution: createSolution,
        responses: lessonStepData.responses ?? null,
        options: JSON.stringify(createOptions),
        lesson: { id: lessonStepData.lesson_id } as Lesson,
        lessonStepType: { id: stepType.id } as LessonStepType,
        media_url: lessonStepData.media_url ?? null,
        media_type: lessonStepData.media_type ?? null,
        is_active:
          typeof lessonStepData.is_active === 'boolean'
            ? lessonStepData.is_active
            : true,
      });

      return await stepRepository.save(step);
    });
  }

  async update(
    id: number,
    lessonStepData: UpdateLessonStepDto,
  ): Promise<LessonStep> {
    return await this.lessonStepRepository.manager.transaction(async (manager) => {
      const stepRepository = manager.getRepository(LessonStep);
      const lessonRepository = manager.getRepository(Lesson);
      const stepTypeRepository = manager.getRepository(LessonStepType);

      const step = await stepRepository.findOne({
        where: { id },
        relations: ['lesson', 'lessonStepType'],
      });

      if (!step) {
        throw new NotFoundException(`Lesson step with id ${id} not found`);
      }

      if (typeof lessonStepData.title === 'string') {
        step.title = lessonStepData.title;
      }

      if (typeof lessonStepData.description === 'string') {
        step.description = lessonStepData.description;
      }

      if (typeof lessonStepData.prompt === 'string') {
        step.prompt = this.normalizeGapPlaceholders(lessonStepData.prompt);
      }

      if (typeof lessonStepData.solution === 'string') {
        step.solution = lessonStepData.solution;
      }

      if (typeof lessonStepData.responses === 'string') {
        step.responses = lessonStepData.responses || null;
      }

      if (Array.isArray(lessonStepData.options)) {
        step.options = JSON.stringify(lessonStepData.options);
      }

      if (typeof lessonStepData.is_active === 'boolean') {
        step.is_active = lessonStepData.is_active;
      }

      if (typeof lessonStepData.media_url === 'string') {
        step.media_url = lessonStepData.media_url || null;
      }

      if (typeof lessonStepData.media_type === 'string') {
        step.media_type = lessonStepData.media_type;
      }

      if (typeof lessonStepData.step_type_code === 'string') {
        const stepType = await stepTypeRepository.findOne({
          where: { code: lessonStepData.step_type_code },
        });
        if (!stepType) {
          throw new NotFoundException(
            `Lesson step type ${lessonStepData.step_type_code} not found`,
          );
        }
        step.lessonStepType = { id: stepType.id } as LessonStepType;
      }

      const currentStepTypeCode =
        lessonStepData.step_type_code ??
        step.lessonStepType?.code ??
        '';

      if (currentStepTypeCode === 'THEORY_COMPLETE') {
        const optionsForValidation = Array.isArray(lessonStepData.options)
          ? lessonStepData.options
          : (() => {
              try {
                const parsed = JSON.parse(step.options || '[]');
                return Array.isArray(parsed)
                  ? parsed.map((o) => String(o))
                  : [];
              } catch {
                return [];
              }
            })();

        this.validateTheoryCompletePayload(
          step.prompt ?? '',
          step.solution ?? '',
          optionsForValidation,
        );
      }

      if (
        currentStepTypeCode === 'CODE_COMPLETE' ||
        currentStepTypeCode === 'CODE_COMPLETE_TYPED'
      ) {
        const optionsForValidation = Array.isArray(lessonStepData.options)
          ? lessonStepData.options
          : (() => {
              try {
                const parsed = JSON.parse(step.options || '[]');
                return Array.isArray(parsed)
                  ? parsed.map((o) => String(o))
                  : [];
              } catch {
                return [];
              }
            })();

        this.validateCodeCompletePayload(
          step.prompt ?? '',
          step.solution ?? '',
          optionsForValidation,
          currentStepTypeCode === 'CODE_COMPLETE_TYPED',
        );
      }

      const targetLessonId = lessonStepData.lesson_id ?? step.lesson.id;
      if (typeof lessonStepData.lesson_id === 'number') {
        const lesson = await lessonRepository.findOne({
          where: { id: lessonStepData.lesson_id, is_active: true },
          relations: ['course'],
        });

        if (!lesson) {
          throw new NotFoundException(
            `Lesson with id ${lessonStepData.lesson_id} not found`,
          );
        }

        if (
          typeof lessonStepData.course_id === 'number' &&
          lesson.course.id !== lessonStepData.course_id
        ) {
          throw new NotFoundException(
            `Lesson ${lessonStepData.lesson_id} does not belong to course ${lessonStepData.course_id}`,
          );
        }
      } else if (typeof lessonStepData.course_id === 'number') {
        const currentLesson = await lessonRepository.findOne({
          where: { id: step.lesson.id },
          relations: ['course'],
        });
        if (!currentLesson || currentLesson.course.id !== lessonStepData.course_id) {
          throw new NotFoundException(
            `Step ${id} does not belong to course ${lessonStepData.course_id}`,
          );
        }
      }

      const hasReorderPayload =
        typeof lessonStepData.order === 'number' ||
        typeof lessonStepData.lesson_id === 'number';

      if (hasReorderPayload) {
        await this.reorderStepInTransaction(
          manager,
          id,
          targetLessonId,
          lessonStepData.order ?? step.order,
        );
      }

      const refreshed = await stepRepository.findOne({
        where: { id },
        relations: ['lesson', 'lessonStepType'],
      });

      if (!refreshed) {
        throw new NotFoundException(`Lesson step with id ${id} not found`);
      }

      Object.assign(refreshed, {
        title: step.title,
        description: step.description,
        prompt: step.prompt,
        solution: step.solution,
        responses: step.responses,
        options: step.options,
        is_active: step.is_active,
        media_url: step.media_url,
        media_type: step.media_type,
        lessonStepType: step.lessonStepType,
      });

      return await stepRepository.save(refreshed);
    });
  }

  async remove(id: number): Promise<void> {
    const lessonStep = await this.findOne(id);
    lessonStep.is_active = false;
    await this.lessonStepRepository.save(lessonStep);
  }

  async findByLesson(lessonId: number): Promise<LessonStep[]> {
    return await this.lessonStepRepository.find({
      where: {
        lesson: { id: lessonId },
        is_active: true,
      },
      relations: {
        lessonStepType: true, 
      },
      order: { order: 'ASC' },
    });
  }

  async updateMedia(
    id: number,
    mediaUrl: string | null,
    mediaType: 'image' | 'gif' | null,
  ): Promise<LessonStep> {
    const lessonStep = await this.findOne(id);
    lessonStep.media_url = mediaUrl;
    lessonStep.media_type = mediaType;
    return await this.lessonStepRepository.save(lessonStep);
  }

  async getAdminLessonStepsManagement(
    search?: string,
    page = 1,
    limit = 20,
    isActive?: boolean,
    lessonId?: number,
    courseId?: number,
    stepTypeCode?: string,
  ): Promise<AdminLessonStepManagementResponseDto> {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(limit, 100)
        : 20;

    const countQuery = this.lessonStepRepository
      .createQueryBuilder('step')
      .leftJoin('step.lesson', 'lesson')
      .leftJoin('lesson.course', 'course')
      .leftJoin('step.lessonStepType', 'stepType');

    if (typeof isActive === 'boolean') {
      countQuery.andWhere('step.is_active = :isActive', { isActive });
    }

    if (Number.isFinite(lessonId) && (lessonId as number) > 0) {
      countQuery.andWhere('lesson.id = :lessonId', { lessonId });
    }

    if (Number.isFinite(courseId) && (courseId as number) > 0) {
      countQuery.andWhere('course.id = :courseId', { courseId });
    }

    if (stepTypeCode && stepTypeCode.trim().length > 0) {
      countQuery.andWhere('stepType.code = :stepTypeCode', {
        stepTypeCode: stepTypeCode.trim(),
      });
    }

    if (search && search.trim().length > 0) {
      countQuery.andWhere(
        '(step.title LIKE :q OR step.description LIKE :q OR lesson.title LIKE :q OR course.title LIKE :q)',
        { q: `%${search.trim()}%` },
      );
    }

    const total = await countQuery.getCount();

    const query = this.lessonStepRepository
      .createQueryBuilder('step')
      .leftJoin('step.lesson', 'lesson')
      .leftJoin('lesson.course', 'course')
      .leftJoin('step.lessonStepType', 'stepType')
      .select('step.id', 'id')
      .addSelect('step.order', 'order')
      .addSelect('step.title', 'title')
      .addSelect('step.description', 'description')
      .addSelect('step.is_active', 'is_active')
      .addSelect('step.media_url', 'media_url')
      .addSelect('step.media_type', 'media_type')
      .addSelect('step.responses', 'responses')
      .addSelect('lesson.id', 'lesson_id')
      .addSelect('lesson.title', 'lesson_title')
      .addSelect('course.id', 'course_id')
      .addSelect('course.title', 'course_title')
      .addSelect('stepType.code', 'step_type_code')
      .orderBy('course.position', 'ASC')
      .addOrderBy('lesson.order', 'ASC')
      .addOrderBy('step.order', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    if (typeof isActive === 'boolean') {
      query.andWhere('step.is_active = :isActive', { isActive });
    }

    if (Number.isFinite(lessonId) && (lessonId as number) > 0) {
      query.andWhere('lesson.id = :lessonId', { lessonId });
    }

    if (Number.isFinite(courseId) && (courseId as number) > 0) {
      query.andWhere('course.id = :courseId', { courseId });
    }

    if (stepTypeCode && stepTypeCode.trim().length > 0) {
      query.andWhere('stepType.code = :stepTypeCode', {
        stepTypeCode: stepTypeCode.trim(),
      });
    }

    if (search && search.trim().length > 0) {
      query.andWhere(
        '(step.title LIKE :q OR step.description LIKE :q OR lesson.title LIKE :q OR course.title LIKE :q)',
        { q: `%${search.trim()}%` },
      );
    }

    const rawItems = await query.getRawMany();

    return {
      items: rawItems.map((row) => ({
        id: Number(row.id),
        order: Number(row.order),
        title: row.title,
        description: row.description,
        is_active: Boolean(Number(row.is_active)),
        lesson_id: Number(row.lesson_id),
        lesson_title: row.lesson_title,
        course_id: Number(row.course_id),
        course_title: row.course_title,
        step_type_code: row.step_type_code,
        responses: row.responses ?? null,
        media_url: row.media_url ?? null,
        media_type: row.media_type ?? null,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }
}

