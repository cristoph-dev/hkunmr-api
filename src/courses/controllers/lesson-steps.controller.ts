import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LessonStepsService } from '../services/lesson-steps.service';
import { LessonStep } from '../entities/lesson-step.entity';
import { LessonStepResponseDto } from '../dto/response/lesson-step-response.dto';

@ApiTags('Lesson Steps [Estudiantes]')
@ApiBearerAuth()
@Controller('lesson-steps')
export class LessonStepsStudentController {
  constructor(private readonly lessonStepsService: LessonStepsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los pasos de leccion [Estudiante]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los pasos de leccion',
    type: [LessonStepResponseDto],
  })
  findAll(): Promise<LessonStep[]> {
    return this.lessonStepsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un paso de leccion por ID [Estudiante]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna un paso de leccion',
    type: LessonStepResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Paso de leccion no encontrado' })
  findOne(@Param('id') id: string): Promise<LessonStep> {
    return this.lessonStepsService.findOne(+id, true);
  }

  @Get('by-lesson/:lessonId')
  @ApiOperation({ summary: 'Obtener todos los pasos de una leccion [Estudiante]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los pasos asociados a una leccion',
    type: [LessonStepResponseDto],
  })
  findByLesson(@Param('lessonId') lessonId: string): Promise<LessonStep[]> {
    return this.lessonStepsService.findByLesson(+lessonId);
  }
}
