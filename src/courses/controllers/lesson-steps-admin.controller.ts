import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Admin } from 'src/common/guards/role.guard';
import { LessonStepsService } from '../services/lesson-steps.service';
import { AdminLessonStepManagementResponseDto } from '../dto/response/admin-lesson-step-management-response.dto';

@ApiTags('Lesson Steps [Admin]')
@ApiBearerAuth()
@Admin()
@Controller('admin/lesson-steps')
export class LessonStepsAdminController {
  constructor(private readonly lessonStepsService: LessonStepsService) {}

  @Get('management')
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Busqueda por step, leccion o curso',
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
    description: 'Filtrar por estado activo del step',
  })
  @ApiQuery({
    name: 'lesson_id',
    required: false,
    type: Number,
    description: 'Filtrar por leccion',
  })
  @ApiQuery({
    name: 'course_id',
    required: false,
    type: Number,
    description: 'Filtrar por curso',
  })
  @ApiQuery({
    name: 'step_type_code',
    required: false,
    type: String,
    description: 'Filtrar por tipo de step (THEORY, SINGLE_CHOICE, etc.)',
  })
  @ApiOperation({ summary: 'Listar steps para gestion [Admin]' })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de steps con su leccion y curso',
    type: AdminLessonStepManagementResponseDto,
  })
  findManagement(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('is_active') isActive?: string,
    @Query('lesson_id') lessonId?: string,
    @Query('course_id') courseId?: string,
    @Query('step_type_code') stepTypeCode?: string,
  ): Promise<AdminLessonStepManagementResponseDto> {
    const parsedIsActive =
      typeof isActive === 'string' ? isActive.toLowerCase() === 'true' : undefined;

    return this.lessonStepsService.getAdminLessonStepsManagement(
      q,
      Number(page),
      Number(limit),
      parsedIsActive,
      Number(lessonId),
      Number(courseId),
      stepTypeCode,
    );
  }
}
