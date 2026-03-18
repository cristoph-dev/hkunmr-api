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
import { UserLessonsService } from '../services/user-lessons.service';
import { Course } from '../entities/course.entity';
import { CourseResponseDto } from '../dto/response/course-response.dto';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { AllRoles, Student, Teacher } from 'src/common/guards/role.guard';
import { AuthenticatedUser } from 'src/common/decorators/authenticated.decorator';
import type { UserPayload } from 'src/common/lib/types';
import { UserCourse } from '../entities/course-user.entity';
import { UserLesson } from '../entities/lesson-user.entity';
import { ProgressEnum } from 'src/common/lib/const';
import { AdminDashboardResponseDto } from '../dto/response/admin-dashboard-response.dto';
import { AdminCourseManagementResponseDto } from '../dto/response/admin-course-management-response.dto';
import { SubmitStepAnswerDto } from '../dto/submit-step-answer.dto';

interface UserCourseCatalogResponse {
  course: Course;
  is_enrolled: boolean;
  is_unlocked: boolean;
  progress: ProgressEnum | null;
  enrollment_id: number | null;
  user_lessons?: UserCourse['user_lessons'];
}
@ApiBearerAuth()
@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly userCoursesService: UserCoursesService,
    private readonly userLessonsService: UserLessonsService,
  ) { }

    @Get()
    @Teacher()
    @ApiQuery({
      name: 'cascade',
      required: false,
      type: String,
      example: 'full',
      description: 'Usar "full" para traer lessons y steps',
    })
    @ApiOperation({ summary: 'Obtener todos los cursos (modo gestión)' })
    @ApiResponse({
      status: 200,
      description: 'Retorna todos los cursos',
      type: [CourseResponseDto],
    })
    findAll(
      @Query('cascade') cascade?: string,
    ): Promise<Course[]> {
      return this.coursesService.findAll(cascade);
    }


  @Get(':id')
  @AllRoles()
  @ApiOperation({ summary: 'Obtener un curso por ID' })
  @ApiResponse({
    status: 200,
    description: 'Retorna un curso',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  findOne(@Param('id') id: string): Promise<Course> {
    return this.coursesService.findOne(+id);
  }

  @Post()
  @Teacher()
  @ApiOperation({ summary: 'Crear un nuevo curso' })
  @ApiResponse({
    status: 201,
    description: 'Curso creado exitosamente',
    type: CourseResponseDto,
  })
  create(@Body() courseData: CreateCourseDto): Promise<Course> {
    return this.coursesService.create(courseData);
  }

  @Patch(':id')
  @Teacher()
  @ApiOperation({ summary: 'Actualizar un curso' })
  @ApiResponse({
    status: 200,
    description: 'Curso actualizado exitosamente',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  update(
    @Param('id') id: string,
    @Body() courseData: UpdateCourseDto,
  ): Promise<Course> {
    return this.coursesService.update(+id, courseData);
  }

  @Delete(':id')
  @Teacher()
  @ApiOperation({ summary: 'Eliminar un curso (soft delete)' })
  @ApiResponse({ status: 200, description: 'Curso eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.coursesService.remove(+id);
  }

  @Get('user/enroll')
  @AllRoles()
  @ApiQuery({
    name: 'cascade',
    required: false,
    type: Boolean,
    description: 'Obtener toda data de los cursos del usuario',
  })
  @ApiOperation({ summary: 'Obtener todos los cursos del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Retorna catalogo de cursos (inscrito o no) [Estudiantes]',
  })
  findByUser(
    @AuthenticatedUser() user: UserPayload,
    @Query('cascade') cascade?: boolean,
  ): Promise<UserCourseCatalogResponse[]> {
    return this.coursesService.findCatalogByUserId(user.id, cascade, user.roles);
  }

  @Post(':id/enroll')
  @Student()
  @ApiOperation({ summary: 'Inscribirse en un curso' })
  @ApiResponse({ status: 201, description: 'Inscripción exitosa' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  @ApiResponse({ status: 400, description: 'Ya está inscrito en este curso' })
  async enroll(
    @Param('id') courseId: string,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<{ message: string }> {
    await this.userCoursesService.enroll(+courseId, user.id);
    return { message: 'Inscripción exitosa' };
  }

@Post('enroll/:id')
@Student()
@ApiOperation({ summary: 'Inscribirse en un curso (ruta alternativa)' })
@ApiResponse({ status: 201, description: 'Inscripción exitosa' })
@ApiResponse({ status: 404, description: 'Curso no encontrado' })
@ApiResponse({ status: 400, description: 'Ya está inscrito en este curso' })
async enrollAlias(
  @Param('id') courseId: string,
  @AuthenticatedUser() user: UserPayload,
): Promise<{ message: string }> {
  await this.userCoursesService.enroll(+courseId, user.id);
  return { message: 'Inscripción exitosa' };
}

@Post(':courseId/users/:userId')
@Teacher() 
@ApiOperation({ summary: 'Inscribir un usuario en un curso [Profesor/admin]'})
@ApiResponse({ status: 201, description: 'Usuario inscrito exitosamente' })
@ApiResponse({ status: 404, description: 'Curso o usuario no encontrado' })
@ApiResponse({ status: 400, description: 'El usuario ya está inscrito' })
async enrollUserByAdmin(
  @Param('courseId') courseId: string,
  @Param('userId') userId: string,
): Promise<{ message: string }> {
  await this.userCoursesService.enroll(+courseId, +userId);
  return { message: 'Usuario inscrito exitosamente' };
}

  @Post('lessons/:lessonId/complete')
@AllRoles()
@ApiOperation({ summary: 'Completar leccion y desbloquear la siguiente [Todos los roles]' })
@ApiResponse({
  status: 200,
  description: 'Leccion completada y progreso actualizado',
})
@ApiResponse({ status: 404, description: 'Inscripcion de leccion no encontrada' })
completeLessonAndAdvance(
  @Param('lessonId') lessonId: string,
  @AuthenticatedUser() user: UserPayload,
): Promise<UserLesson> {
  return this.userLessonsService.completeLessonAndAdvance(+lessonId, user.id);
}

@Post('lessons/:lessonId/steps/:stepId/answer')
@AllRoles()
@ApiOperation({ summary: 'Responder un step de leccion y ganar medallas [Todos los roles]' })
@ApiResponse({
  status: 200,
  description: 'Resultado de la respuesta del step y medallas obtenidas',
})
submitStepAnswer(
  @Param('lessonId') lessonId: string,
  @Param('stepId') stepId: string,
  @AuthenticatedUser() user: UserPayload,
  @Body() payload: SubmitStepAnswerDto,
): Promise<{
  lesson_id: number;
  step_id: number;
  is_correct: boolean;
  is_answered: boolean;
  attempts_count: number;
  medals_earned: number;
  lesson_progress: ProgressEnum;
}> {
  return this.userLessonsService.submitStepAnswer(
    +lessonId,
    +stepId,
    user.id,
    payload,
  );
}

@Get('admin/dashboard-summary')
@Teacher()
@ApiOperation({ summary: 'Obtener resumen del dashboard [Admin]' })
@ApiResponse({
  status: 200,
  description: 'Resumen de métricas para el dashboard administrativo',
  type: AdminDashboardResponseDto,
})
getAdminDashboardSummary(): Promise<AdminDashboardResponseDto> {
  return this.coursesService.getAdminDashboardSummary();
}

@Get('admin/management')
@Teacher()
@ApiQuery({
  name: 'q',
  required: false,
  type: String,
  description: 'Busqueda por titulo de curso',
})
@ApiQuery({
  name: 'page',
  required: false,
  type: Number,
  description: 'Pagina (default 1)',
})
@ApiQuery({
  name: 'limit',
  required: false,
  type: Number,
  description: 'Limite por pagina (default 20, max 100)',
})
@ApiQuery({
  name: 'is_active',
  required: false,
  type: Boolean,
  description: 'Filtrar por estado activo del curso',
})
@ApiOperation({ summary: 'Listar cursos para gestion [Admin/Profesor]' })
@ApiResponse({
  status: 200,
  description: 'Listado paginado para administracion de cursos',
  type: AdminCourseManagementResponseDto,
})
getAdminCoursesManagement(
  @Query('q') q?: string,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('is_active') isActive?: string,
): Promise<AdminCourseManagementResponseDto> {
  const parsedIsActive =
    typeof isActive === 'string' ? isActive.toLowerCase() === 'true' : undefined;

  return this.coursesService.getAdminCoursesManagement(
    q,
    Number(page),
    Number(limit),
    parsedIsActive,
  );
}

}
