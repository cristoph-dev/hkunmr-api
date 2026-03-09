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
import { LessonsService } from '../services/lessons.service';
import { Lesson } from '../entities/lesson.entity';
import { LessonResponseDto } from '../dto/response/lesson-response.dto';
import { Admin, AllRoles, Teacher } from 'src/common/guards/role.guard';
import { AdminLessonManagementResponseDto } from '../dto/response/admin-lesson-management-response.dto';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { ReorderLessonDto } from '../dto/reorder-lesson.dto';
@ApiTags('lessons')
@ApiBearerAuth()
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @AllRoles()
  @ApiOperation({ summary: 'Obtener todas las lecciones' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todas las lecciones',
    type: [LessonResponseDto],
  })
  findAll(): Promise<Lesson[]> {
    return this.lessonsService.findAll();
  }

  @Get('admin/management')
  @Admin()
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
  findAdminManagement(
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

  @Get(':id')
  @AllRoles()
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
  @Teacher()
  @ApiOperation({ summary: 'Crear una nueva lección' })
  @ApiResponse({
    status: 201,
    description: 'Lección creada exitosamente',
    type: LessonResponseDto,
  })
  create(@Body() lessonData: CreateLessonDto): Promise<Lesson> {
    return this.lessonsService.create(lessonData);
  }

  @Patch(':id')
  @Teacher()
  @ApiOperation({ summary: 'Actualizar una lección' })
  @ApiResponse({
    status: 200,
    description: 'Lección actualizada exitosamente',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lección no encontrada' })
  update(
    @Param('id') id: string,
    @Body() lessonData: UpdateLessonDto,
  ): Promise<Lesson> {
    return this.lessonsService.update(+id, lessonData);
  }

  @Patch(':id/reorder')
  @Teacher()
  @ApiOperation({ summary: 'Reordenar lección de forma segura (ion-reorder)' })
  @ApiResponse({
    status: 200,
    description: 'Lección reordenada exitosamente',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lección o curso no encontrado' })
  reorder(
    @Param('id') id: string,
    @Body() payload: ReorderLessonDto,
  ): Promise<Lesson> {
    return this.lessonsService.reorder(+id, payload);
  }

  @Delete(':id')
  @Teacher()
  @ApiOperation({ summary: 'Eliminar una lección (soft delete)' })
  @ApiResponse({ status: 200, description: 'Lección eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Lección no encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.lessonsService.remove(+id);
  }
}
