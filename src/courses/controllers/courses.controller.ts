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
import { CoursesService } from '../services/courses.service';
import { UserCoursesService } from '../services/user-courses.service';
import { Course } from '../entities/course.entity';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly userCoursesService: UserCoursesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los cursos' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los cursos',
    type: [Course],
  })
  findAll(): Promise<Course[]> {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un curso por ID' })
  @ApiResponse({ status: 200, description: 'Retorna un curso', type: Course })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  findOne(@Param('id') id: string): Promise<Course> {
    return this.coursesService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo curso' })
  @ApiResponse({
    status: 201,
    description: 'Curso creado exitosamente',
    type: Course,
  })
  create(@Body() courseData: Partial<Course>): Promise<Course> {
    return this.coursesService.create(courseData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un curso' })
  @ApiResponse({
    status: 200,
    description: 'Curso actualizado exitosamente',
    type: Course,
  })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  update(
    @Param('id') id: string,
    @Body() courseData: Partial<Course>,
  ): Promise<Course> {
    return this.coursesService.update(+id, courseData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un curso (soft delete)' })
  @ApiResponse({ status: 200, description: 'Curso eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.coursesService.remove(+id);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Inscribirse en un curso' })
  @ApiResponse({ status: 201, description: 'Inscripción exitosa' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  @ApiResponse({ status: 400, description: 'Ya está inscrito en este curso' })
  async enroll(
    @Param('id') courseId: string,
    @Body('userId') userId: number,
  ): Promise<{ message: string }> {
    await this.userCoursesService.enroll(+courseId, userId);
    return { message: 'Inscripción exitosa' };
  }
}
