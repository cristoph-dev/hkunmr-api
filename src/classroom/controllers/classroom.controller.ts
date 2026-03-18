import {
  Body,
  Controller,
  Delete,
  Get,
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
import { Teacher, AllRoles } from 'src/common/guards/role.guard';
import { CreateClassroomDto } from '../dto/create-classroom.dto';
import { AssignClassroomStudentsDto } from '../dto/assign-classroom-students.dto';
import { UpdateClassroomDto } from '../dto/update-classroom.dto';
import { AuthenticatedUser } from 'src/common/decorators/authenticated.decorator';
import type { UserPayload } from 'src/common/lib/types';

@ApiTags('classrooms')
@ApiBearerAuth()
@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  @Teacher()
  @ApiOperation({ summary: 'Crear salon [Profesor/Admin]' })
  @ApiResponse({ status: 201, description: 'Salon creado exitosamente' })
  create(
    @AuthenticatedUser() user: UserPayload,
    @Body() payload: CreateClassroomDto,
  ): Promise<{
    id: number;
    name: string;
    code: string;
    teacher: { id: number; name: string; lastname: string; email: string };
    students_count: number;
  }> {
    return this.classroomService.createByTeacher(user, payload);
  }

  @Patch(':id')
  @Teacher()
  @ApiOperation({
    summary: 'Editar salon [Profesor/Admin]',
  })
  @ApiResponse({ status: 200, description: 'Salon actualizado exitosamente' })
  update(
    @Param('id', ParseIntPipe) classroomId: number,
    @AuthenticatedUser() user: UserPayload,
    @Body() payload: UpdateClassroomDto,
  ): Promise<{
    id: number;
    name: string;
    code: string;
    teacher: { id: number; name: string; lastname: string; email: string };
    classmates: Array<{ id: number; name: string; lastname: string; email: string }>;
  }> {
    return this.classroomService.updateClassroom(classroomId, payload, user);
  }

  @Get('my')
  @AllRoles()
  @ApiOperation({ summary: 'Listar salones visibles para el usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Listado de salones' })
  listMine(
    @AuthenticatedUser() user: UserPayload,
  ): Promise<
    Array<{
      id: number;
      name: string;
      code: string;
      teacher: { id: number; name: string; lastname: string; email: string };
      students_count: number;
    }>
  > {
    return this.classroomService.listMine(user);
  }

  @Post(':id/students')
  @Teacher()
  @ApiOperation({ summary: 'Agregar estudiantes al salon [Profesor dueño/Admin]' })
  @ApiResponse({ status: 200, description: 'Estudiantes agregados exitosamente' })
  addStudents(
    @Param('id', ParseIntPipe) classroomId: number,
    @AuthenticatedUser() user: UserPayload,
    @Body() payload: AssignClassroomStudentsDto,
  ): Promise<{
    id: number;
    name: string;
    code: string;
    teacher: { id: number; name: string; lastname: string; email: string };
    classmates: Array<{ id: number; name: string; lastname: string; email: string }>;
  }> {
    return this.classroomService.addStudents(classroomId, payload, user);
  }

  @Delete(':id/students/:studentId')
  @Teacher()
  @ApiOperation({ summary: 'Quitar un estudiante del salon [Profesor dueño/Admin]' })
  @ApiResponse({ status: 200, description: 'Estudiante removido exitosamente' })
  removeStudent(
    @Param('id', ParseIntPipe) classroomId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<{
    id: number;
    name: string;
    code: string;
    teacher: { id: number; name: string; lastname: string; email: string };
    classmates: Array<{ id: number; name: string; lastname: string; email: string }>;
  }> {
    return this.classroomService.removeStudent(classroomId, studentId, user);
  }

  @Delete(':id')
  @Teacher()
  @ApiOperation({ summary: 'Eliminar salon (soft delete) [Profesor dueño/Admin]' })
  @ApiResponse({ status: 200, description: 'Salon eliminado exitosamente' })
  remove(
    @Param('id', ParseIntPipe) classroomId: number,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<{ success: boolean }> {
    return this.classroomService.deleteClassroom(classroomId, user);
  }

  @Get(':id/members')
  @AllRoles()
  @ApiOperation({
    summary: 'Ver profesor y compañeros del salon [Miembros/Admin]',
  })
  @ApiResponse({ status: 200, description: 'Datos del salon con sus miembros' })
  getMembers(
    @Param('id', ParseIntPipe) classroomId: number,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<{
    id: number;
    name: string;
    code: string;
    teacher: { id: number; name: string; lastname: string; email: string };
    classmates: Array<{ id: number; name: string; lastname: string; email: string }>;
  }> {
    return this.classroomService.getMembers(classroomId, user);
  }

  @Get(':id/podium')
  @AllRoles()
  @ApiOperation({
    summary: 'Podio por salon usando medallas actuales del estudiante',
  })
  @ApiResponse({ status: 200, description: 'Ranking por salon' })
  getPodium(
    @Param('id', ParseIntPipe) classroomId: number,
    @AuthenticatedUser() user: UserPayload,
  ): Promise<{
    classroom_id: number;
    classroom_name: string;
    classroom_code: string;
    entries: Array<{
      rank: number;
      student_id: number;
      name: string;
      lastname: string;
      email: string;
      medals: number;
    }>;
  }> {
    return this.classroomService.getPodium(classroomId, user);
  }
}
