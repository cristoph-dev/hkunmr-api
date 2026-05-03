import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Admin } from 'src/common/guards/role.guard';
import { LessonsService } from '../services/lessons.service';
import { AdminLessonManagementResponseDto } from '../dto/response/admin-lesson-management-response.dto';

@ApiTags('Lessons [Admin]')
@ApiBearerAuth()
@Admin()
@Controller('admin/lessons')
export class LessonsAdminController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('management')
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Busqueda por titulo, descripcion o curso',
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
    description: 'Filtrar por estado activo de leccion',
  })
  @ApiQuery({
    name: 'course_id',
    required: false,
    type: Number,
    description: 'Filtrar por curso',
  })
  @ApiOperation({ summary: 'Listar lecciones para gestion [Admin]' })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado para administracion de lecciones',
    type: AdminLessonManagementResponseDto,
  })
  findManagement(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('is_active') isActive?: string,
    @Query('course_id') courseId?: string,
  ): Promise<AdminLessonManagementResponseDto> {
    const parsedIsActive =
      typeof isActive === 'string' ? isActive.toLowerCase() === 'true' : undefined;

    return this.lessonsService.getAdminLessonsManagement(
      q,
      Number(page),
      Number(limit),
      parsedIsActive,
      Number(courseId),
    );
  }
}
