import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClassroomService } from '../services/classroom.service';
import { Admin } from 'src/common/guards/role.guard';
import { CreateClassroomDto } from '../dto/create-classroom.dto';
import { AssignClassroomStudentsDto } from '../dto/assign-classroom-students.dto';
import { UpdateClassroomDto } from '../dto/update-classroom.dto';
import { AuthenticatedUser } from 'src/common/decorators/authenticated.decorator';
import type { UserPayload } from 'src/common/lib/types';

@ApiTags('Classrooms [Admin]')
@ApiBearerAuth()
@Admin()
@Controller('admin/classrooms')
export class ClassroomAdminController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  @ApiOperation({ summary: 'Crear salon [Admin]' })
  @ApiResponse({ status: 201, description: 'Salon creado exitosamente' })
  create(
    @AuthenticatedUser() user: UserPayload,
    @Body() payload: CreateClassroomDto,
  ): Promise<{
    id: number;
    name: string;
    code: string;
    teacher: {
      id: number;
      name: string;
      lastname: string;
      email: string;
      profile_image: string | null;
    } | null;
    students_count: number;
  }> {
    return this.classroomService.createByTeacher(user, payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar salon [Admin]' })
  @ApiResponse({ status: 200, description: 'Salon actualizado exitosamente' })
  update(
    @Param('id', ParseIntPipe) classroomId: number,
    @AuthenticatedUser() user: UserPayload,
    @Body() payload: UpdateClassroomDto,
  ): Promise<{
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    teacher: {
      id: number;
      name: string;
      lastname: string;
      email: string;
      profile_image: string | null;
    } | null;
    classmates: Array<{
      id: number;
      name: string;
      lastname: string;
      email: string;
      profile_image: string | null;
    }>;
  }> {
    return this.classroomService.updateClassroom(classroomId, payload, user);
  }

  @Post(':id/students')
  @ApiOperation({ summary: 'Agregar estudiantes al salon [Admin]' })
  @ApiResponse({ status: 200, description: 'Estudiantes agregados exitosamente' })
  addStudents(
    @Param('id', ParseIntPipe) classroomId: number,
    @AuthenticatedUser() user: UserPayload,
    @Body() payload: AssignClassroomStudentsDto,
  ): Promise<{
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    teacher: {
      id: number;
      name: string;
      lastname: string;
      email: string;
      profile_image: string | null;
    } | null;
    classmates: Array<{
      id: number;
      name: string;
      lastname: string;
      email: string;
      profile_image: string | null;
    }>;
  }> {
    return this.classroomService.addStudents(classroomId, payload, user);
  }

  @Delete(':id/students/:studentId')
  @ApiOperation({ summary: 'Quitar un estudiante del salon [Admin]' })
  @ApiResponse({ status: 200, description: 'Estudiante removido exitosamente' })
  removeStudent(
    @Param('id', ParseIntPipe) classroomId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<{
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    teacher: {
      id: number;
      name: string;
      lastname: string;
      email: string;
      profile_image: string | null;
    } | null;
    classmates: Array<{
      id: number;
      name: string;
      lastname: string;
      email: string;
      profile_image: string | null;
    }>;
  }> {
    return this.classroomService.removeStudent(classroomId, studentId, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar salon (soft delete) [Admin]' })
  @ApiResponse({ status: 200, description: 'Salon eliminado exitosamente' })
  remove(
    @Param('id', ParseIntPipe) classroomId: number,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<{ success: boolean }> {
    return this.classroomService.deleteClassroom(classroomId, user);
  }
}
