import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CoursesService } from '../services/courses.service';
import { UserCoursesService } from '../services/user-courses.service';
import { Course } from '../entities/course.entity';
import { CourseResponseDto } from '../dto/response/course-response.dto';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { Teacher } from 'src/common/guards/role.guard';
import { AuthenticatedUser } from 'src/common/decorators/authenticated.decorator';
import type { UserPayload } from 'src/common/lib/types';
import { TeacherDashboardResponseDto } from '../dto/response/teacher-dashboard-response.dto';

@ApiBearerAuth()
@ApiTags('Courses [Profesores]')
@Controller('teacher/courses')
export class CoursesTeacherController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly userCoursesService: UserCoursesService,
  ) {}

  @Get()
  @Teacher()
  @ApiQuery({
    name: 'cascade',
    required: false,
    type: String,
    example: 'full',
    description: 'Usar "full" para traer lessons y steps',
  })
  @ApiOperation({ summary: 'Obtener todos los cursos (modo gestion) [Profesor]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los cursos',
    type: [CourseResponseDto],
  })
  findAll(
    @Query('cascade') cascade?: string,
    @AuthenticatedUser() user?: UserPayload,
  ): Promise<Course[]> {
    return this.coursesService.findAll(cascade, user);
  }

  @Get('dashboard-summary')
  @Teacher()
  @ApiOperation({ summary: 'Obtener resumen del dashboard [Profesor]' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de metricas de cursos, salones y estudiantes del profesor',
    type: TeacherDashboardResponseDto,
  })
  getTeacherDashboardSummary(
    @AuthenticatedUser() user: UserPayload,
  ): Promise<TeacherDashboardResponseDto> {
    return this.coursesService.getTeacherDashboardSummary(user.id);
  }

  @Get(':id')
  @Teacher()
  @ApiOperation({ summary: 'Obtener un curso por ID [Profesor]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna un curso',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user?: UserPayload,
  ): Promise<Course> {
    return this.coursesService.findOne(+id, user);
  }

  @Post()
  @Teacher()
  @ApiOperation({ summary: 'Crear un nuevo curso [Profesor]' })
  @ApiResponse({
    status: 201,
    description: 'Curso creado exitosamente',
    type: CourseResponseDto,
  })
  create(
    @Body() courseData: CreateCourseDto,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<Course> {
    return this.coursesService.create(courseData, user);
  }

  @Patch(':id')
  @Teacher()
  @ApiOperation({ summary: 'Actualizar un curso [Profesor]' })
  @ApiResponse({
    status: 200,
    description: 'Curso actualizado exitosamente',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  update(
    @Param('id') id: string,
    @Body() courseData: UpdateCourseDto,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<Course> {
    return this.coursesService.update(+id, courseData, user);
  }

  @Delete(':id')
  @Teacher()
  @ApiOperation({ summary: 'Eliminar un curso (borrado real) [Profesor]' })
  @ApiResponse({ status: 200, description: 'Curso eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<void> {
    return this.coursesService.remove(+id, user);
  }

  @Post(':courseId/users/:userId')
  @Teacher()
  @ApiOperation({ summary: 'Inscribir un usuario en un curso [Profesor]' })
  @ApiResponse({ status: 201, description: 'Usuario inscrito exitosamente' })
  @ApiResponse({ status: 404, description: 'Curso o usuario no encontrado' })
  @ApiResponse({ status: 400, description: 'El usuario ya esta inscrito' })
  async enrollUserByAdmin(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.userCoursesService.enroll(+courseId, +userId);
    return { message: 'Usuario inscrito exitosamente' };
  }
}
