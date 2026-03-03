import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LessonStepsService } from '../services/lesson-steps.service';
import { LessonStep } from '../entities/lesson-step.entity';
import { LessonStepResponseDto } from '../dto/response/lesson-step-response.dto';
import { AllRoles, Teacher } from 'src/common/guards/role.guard';
@ApiTags('lesson-steps')
@ApiBearerAuth()
@Controller('lesson-steps')
export class LessonStepsController {
  constructor(private readonly lessonStepsService: LessonStepsService) {}

  @Get()
  @AllRoles()
  @ApiOperation({ summary: 'Obtener todos los pasos de lección' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los pasos de lección',
    type: [LessonStepResponseDto],
  })
  findAll(): Promise<LessonStep[]> {
    return this.lessonStepsService.findAll();
  }

  

  @Get(':id')
  @AllRoles()
  @ApiOperation({ summary: 'Obtener un paso de lección por ID' })
  @ApiResponse({
    status: 200,
    description: 'Retorna un paso de lección',
    type: LessonStepResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Paso de lección no encontrado' })
  findOne(@Param('id') id: string): Promise<LessonStep> {
    return this.lessonStepsService.findOne(+id);
  }

  @Get('by-lesson/:lessonId')
  @AllRoles()
  @ApiOperation({ summary: 'Obtener todos los pasos de una lección' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los pasos asociados a una lección',
    type: [LessonStepResponseDto],
  })
  findByLesson(
    @Param('lessonId') lessonId: string,
  ): Promise<LessonStep[]> {
    return this.lessonStepsService.findByLesson(+lessonId);
  }

  @Post()
  @Teacher()
  @ApiOperation({ summary: 'Crear un nuevo paso de lección' })
  @ApiResponse({
    status: 201,
    description: 'Paso de lección creado exitosamente',
    type: LessonStepResponseDto,
  })
  create(@Body() lessonStepData: Partial<LessonStep>): Promise<LessonStep> {
    return this.lessonStepsService.create(lessonStepData);
  }

  @Patch(':id')
  @Teacher()
  @ApiOperation({ summary: 'Actualizar un paso de lección' })
  @ApiResponse({
    status: 200,
    description: 'Paso de lección actualizado exitosamente',
    type: LessonStepResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Paso de lección no encontrado' })
  update(
    @Param('id') id: string,
    @Body() lessonStepData: Partial<LessonStep>,
  ): Promise<LessonStep> {
    return this.lessonStepsService.update(+id, lessonStepData);
  }

  @Delete(':id')
  @Teacher()
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

