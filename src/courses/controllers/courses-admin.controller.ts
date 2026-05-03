import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Admin } from 'src/common/guards/role.guard';
import { CoursesService } from '../services/courses.service';
import { AdminDashboardResponseDto } from '../dto/response/admin-dashboard-response.dto';
import { AdminCourseManagementResponseDto } from '../dto/response/admin-course-management-response.dto';

@ApiBearerAuth()
@ApiTags('Courses [Admin]')
@Admin()
@Controller('admin/courses')
export class CoursesAdminController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Obtener resumen del dashboard [Admin]' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de metricas para el dashboard administrativo',
    type: AdminDashboardResponseDto,
  })
  getAdminDashboardSummary(): Promise<AdminDashboardResponseDto> {
    return this.coursesService.getAdminDashboardSummary();
  }

  @Get('management')
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
  @ApiOperation({ summary: 'Listar cursos para gestion [Admin]' })
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
