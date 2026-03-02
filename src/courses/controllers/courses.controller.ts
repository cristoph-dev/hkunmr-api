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
import { AllRoles, Student, Teacher } from 'src/common/guards/role.guard';
import { AuthenticatedUser } from 'src/common/decorators/authenticated.decorator';
import type { UserPayload } from 'src/common/lib/types';
import { UserCourse } from '../entities/course-user.entity';
@ApiBearerAuth()
@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly userCoursesService: UserCoursesService,
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
  @ApiQuery({
    name: 'cascade',
    required: false,
    type: Boolean,
    description: 'Obtener toda data de los cursos del usuario',
  })
  @ApiOperation({ summary: 'Obtener todos los cursos del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Retorna todos los cursos del usuario',
  })
  findByUser(@AuthenticatedUser() user: UserPayload, @Query('cascade') cascade?: boolean): Promise<UserCourse[]> {
    return this.coursesService.findByUserId(user.id, cascade);
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

}
