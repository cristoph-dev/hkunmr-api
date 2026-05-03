import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LessonsService } from '../services/lessons.service';
import { Lesson } from '../entities/lesson.entity';
import { LessonResponseDto } from '../dto/response/lesson-response.dto';
import { Student } from 'src/common/guards/role.guard';

@ApiTags('Lessons [Estudiantes]')
@ApiBearerAuth()
@Controller('lessons')
export class LessonsStudentController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @Student()
  @ApiOperation({ summary: 'Obtener todas las lecciones [Estudiante]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todas las lecciones',
    type: [LessonResponseDto],
  })
  findAll(): Promise<Lesson[]> {
    return this.lessonsService.findAll();
  }

  @Get(':id')
  @Student()
  @ApiOperation({ summary: 'Obtener una leccion por ID [Estudiante]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna una leccion',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Leccion no encontrada' })
  findOne(@Param('id') id: string): Promise<Lesson> {
    return this.lessonsService.findOne(+id);
  }
}
