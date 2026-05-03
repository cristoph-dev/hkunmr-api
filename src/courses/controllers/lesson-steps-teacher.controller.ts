import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { LessonStepsService } from '../services/lesson-steps.service';
import { LessonStep } from '../entities/lesson-step.entity';
import { LessonStepResponseDto } from '../dto/response/lesson-step-response.dto';
import { AdminLessonStepManagementResponseDto } from '../dto/response/admin-lesson-step-management-response.dto';
import { CreateLessonStepDto } from '../dto/create-lesson-step.dto';
import { UpdateLessonStepDto } from '../dto/update-lesson-step.dto';
import { Teacher } from 'src/common/guards/role.guard';

@ApiTags('Lesson Steps [Profesores]')
@ApiBearerAuth()
@Controller('teacher/lesson-steps')
export class LessonStepsTeacherController {
  constructor(private readonly lessonStepsService: LessonStepsService) {}

  @Get()
  @Teacher()
  @ApiOperation({ summary: 'Obtener todos los pasos de leccion [Profesor]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los pasos de leccion',
    type: [LessonStepResponseDto],
  })
  findAll(): Promise<LessonStep[]> {
    return this.lessonStepsService.findAll();
  }

  @Get('management')
  @Teacher()
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
  @ApiOperation({ summary: 'Listar steps para gestion [Profesor]' })
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

  @Get(':id')
  @Teacher()
  @ApiOperation({ summary: 'Obtener un paso de leccion por ID [Profesor]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna un paso de leccion',
    type: LessonStepResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Paso de leccion no encontrado' })
  findOne(@Param('id') id: string): Promise<LessonStep> {
    return this.lessonStepsService.findOne(+id, true);
  }

  @Get('by-lesson/:lessonId')
  @Teacher()
  @ApiOperation({ summary: 'Obtener todos los pasos de una leccion [Profesor]' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los pasos asociados a una leccion',
    type: [LessonStepResponseDto],
  })
  findByLesson(@Param('lessonId') lessonId: string): Promise<LessonStep[]> {
    return this.lessonStepsService.findByLesson(+lessonId);
  }

  @Post()
  @Teacher()
  @ApiOperation({ summary: 'Crear un nuevo paso de leccion [Profesor]' })
  @ApiResponse({
    status: 201,
    description: 'Paso de leccion creado exitosamente',
    type: LessonStepResponseDto,
  })
  create(@Body() lessonStepData: CreateLessonStepDto): Promise<LessonStep> {
    return this.lessonStepsService.create(lessonStepData);
  }

  @Patch(':id')
  @Teacher()
  @ApiOperation({ summary: 'Actualizar un paso de leccion [Profesor]' })
  @ApiResponse({
    status: 200,
    description: 'Paso de leccion actualizado exitosamente',
    type: LessonStepResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Paso de leccion no encontrado' })
  update(
    @Param('id') id: string,
    @Body() lessonStepData: UpdateLessonStepDto,
  ): Promise<LessonStep> {
    return this.lessonStepsService.update(+id, lessonStepData);
  }

  @Delete(':id')
  @Teacher()
  @ApiOperation({ summary: 'Eliminar un paso de leccion (soft delete) [Profesor]' })
  @ApiResponse({
    status: 200,
    description: 'Paso de leccion eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Paso de leccion no encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.lessonStepsService.remove(+id);
  }

  @Post(':id/media')
  @Teacher()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), 'public', 'lesson-steps');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const randomSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${randomSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Tipo de archivo no permitido'),
            false,
          );
        }

        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Subir imagen o gif para un paso de leccion [Profesor]' })
  @ApiResponse({
    status: 201,
    description: 'Media de paso de leccion actualizada exitosamente',
    type: LessonStepResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Archivo invalido' })
  @ApiResponse({ status: 404, description: 'Paso de leccion no encontrado' })
  async uploadMedia(
    @Param('id') id: string,
    @UploadedFile() file?: { filename: string; mimetype: string },
  ): Promise<LessonStep> {
    if (!file) {
      throw new BadRequestException('Debe enviar un archivo');
    }

    const mediaUrl = `/public/lesson-steps/${file.filename}`;
    const mediaType: 'image' | 'gif' =
      file.mimetype === 'image/gif' ? 'gif' : 'image';

    return await this.lessonStepsService.updateMedia(
      +id,
      mediaUrl,
      mediaType,
    );
  }
}
