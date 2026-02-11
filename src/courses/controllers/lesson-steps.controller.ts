import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LessonStepsService } from '../services/lesson-steps.service';
import { LessonStep } from '../entities/lesson-step.entity';

@ApiTags('lesson-steps')
@Controller('lesson-steps')
export class LessonStepsController {
  constructor(private readonly lessonStepsService: LessonStepsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los pasos de lección' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los pasos de lección',
    type: [LessonStep],
  })
  findAll(): Promise<LessonStep[]> {
    return this.lessonStepsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un paso de lección por ID' })
  @ApiResponse({
    status: 200,
    description: 'Retorna un paso de lección',
    type: LessonStep,
  })
  @ApiResponse({ status: 404, description: 'Paso de lección no encontrado' })
  findOne(@Param('id') id: string): Promise<LessonStep> {
    return this.lessonStepsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo paso de lección' })
  @ApiResponse({
    status: 201,
    description: 'Paso de lección creado exitosamente',
    type: LessonStep,
  })
  create(@Body() lessonStepData: Partial<LessonStep>): Promise<LessonStep> {
    return this.lessonStepsService.create(lessonStepData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un paso de lección' })
  @ApiResponse({
    status: 200,
    description: 'Paso de lección actualizado exitosamente',
    type: LessonStep,
  })
  @ApiResponse({ status: 404, description: 'Paso de lección no encontrado' })
  update(
    @Param('id') id: string,
    @Body() lessonStepData: Partial<LessonStep>,
  ): Promise<LessonStep> {
    return this.lessonStepsService.update(+id, lessonStepData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un paso de lección (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Paso de lección eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Paso de lección no encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.lessonStepsService.remove(+id);
  }
}
