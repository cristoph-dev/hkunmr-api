import { BadRequestException, Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
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
import { UserCourse } from '../entities/course-user.entity';
import { UserLesson } from '../entities/lesson-user.entity';
import { SubmitStepAnswerDto } from '../dto/submit-step-answer.dto';
import { AllRoles, Student } from 'src/common/guards/role.guard';
import { AuthenticatedUser } from 'src/common/decorators/authenticated.decorator';
import type { UserPayload } from 'src/common/lib/types';
import { ProgressEnum } from 'src/common/lib/const';

interface UserCourseCatalogResponse {
  course: Course;
  is_enrolled: boolean;
  is_unlocked: boolean;
  progress: ProgressEnum | null;
  enrollment_id: number | null;
  user_lessons?: UserCourse['user_lessons'];
}

@ApiBearerAuth()
@ApiTags('Courses [Estudiantes]')
@Controller('courses')
export class CoursesStudentController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly userCoursesService: UserCoursesService,
    private readonly userLessonsService: UserLessonsService,
  ) {}

  @Get('user/enroll')
  @AllRoles()
  @ApiQuery({
    name: 'cascade',
    required: false,
    type: Boolean,
    description: 'Obtener toda data de los cursos del usuario',
  })
  @ApiOperation({ summary: 'Obtener catalogo de cursos del usuario [Estudiantes]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna catalogo de cursos (inscrito o no)',
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
  @ApiResponse({ status: 201, description: 'Inscripcion exitosa' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  @ApiResponse({ status: 400, description: 'Ya esta inscrito en este curso' })
  async enroll(
    @Param('id') courseId: string,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<{ message: string }> {
    const canAccess = await this.coursesService.canUserAccessCourse(
      user.id,
      +courseId,
      user.roles,
    );
    if (!canAccess) {
      throw new BadRequestException('Course is not available for this user');
    }

    await this.userCoursesService.enroll(+courseId, user.id);
    return { message: 'Inscripcion exitosa' };
  }

  @Post('enroll/:id')
  @Student()
  @ApiOperation({ summary: 'Inscribirse en un curso (ruta alternativa)' })
  @ApiResponse({ status: 201, description: 'Inscripcion exitosa' })
  @ApiResponse({ status: 404, description: 'Curso no encontrado' })
  @ApiResponse({ status: 400, description: 'Ya esta inscrito en este curso' })
  async enrollAlias(
    @Param('id') courseId: string,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<{ message: string }> {
    const canAccess = await this.coursesService.canUserAccessCourse(
      user.id,
      +courseId,
      user.roles,
    );
    if (!canAccess) {
      throw new BadRequestException('Course is not available for this user');
    }

    await this.userCoursesService.enroll(+courseId, user.id);
    return { message: 'Inscripcion exitosa' };
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
    awarded_medals: number;
    remaining_medal_tier: number;
    lesson_progress: ProgressEnum;
  }> {
    return this.userLessonsService.submitStepAnswer(
      +lessonId,
      +stepId,
      user.id,
      payload,
    );
  }
}
