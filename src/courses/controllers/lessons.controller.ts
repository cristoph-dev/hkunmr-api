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
import { LessonsService } from '../services/lessons.service';
import { Lesson } from '../entities/lesson.entity';
import { LessonResponseDto } from '../dto/response/lesson-response.dto';

@ApiTags('lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las lecciones' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todas las lecciones',
    type: [LessonResponseDto],
  })
  findAll(): Promise<Lesson[]> {
    return this.lessonsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una lección por ID' })
  @ApiResponse({
    status: 200,
    description: 'Retorna una lección',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lección no encontrada' })
  findOne(@Param('id') id: string): Promise<Lesson> {
    return this.lessonsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva lección' })
  @ApiResponse({
    status: 201,
    description: 'Lección creada exitosamente',
    type: LessonResponseDto,
  })
  create(@Body() lessonData: Partial<Lesson>): Promise<Lesson> {
    return this.lessonsService.create(lessonData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una lección' })
  @ApiResponse({
    status: 200,
    description: 'Lección actualizada exitosamente',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lección no encontrada' })
  update(
    @Param('id') id: string,
    @Body() lessonData: Partial<Lesson>,
  ): Promise<Lesson> {
    return this.lessonsService.update(+id, lessonData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una lección (soft delete)' })
  @ApiResponse({ status: 200, description: 'Lección eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Lección no encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.lessonsService.remove(+id);
  }
}
