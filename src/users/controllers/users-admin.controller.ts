import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  Get,
  Delete,
  Query,
  Patch,
  Body,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Admin, AuthRole } from 'src/common/guards/role.guard';
import { SuccessResponseDto } from 'src/common/dto';
import { UpdateUserAdminDto } from '../dto/update-user-admin.dto';

@ApiTags('Users [Admin]')
@ApiBearerAuth()
@Admin()
@Controller('users')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario (name/lastname/is_active) [Admin]' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
  })
  async updateUserByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateUserAdminDto,
  ): Promise<{
    id: number;
    name: string;
    lastname: string;
    email: string;
    is_active: boolean;
  }> {
    return await this.usersService.updateUserByAdmin(id, payload);
  }

  @Get('admin/teachers')
  @ApiOperation({ summary: 'Listar profesores para gestion [Admin]' })
  @ApiResponse({ status: 200, description: 'Listado de profesores activos' })
  async listTeachersForAdmin(): Promise<
    Array<{
      id: number;
      name: string;
      lastname: string;
      email: string;
      profile_image: string | null;
      role: string;
      is_active: boolean;
      classrooms_count: number;
      students_count: number;
      assigned_classroom: {
        id: number;
        title: string;
      } | null;
    }>
  > {
    return await this.usersService.listTeachersForAdmin();
  }

  @Get('admin/students-candidates')
  @ApiOperation({ summary: 'Listar estudiantes candidatos a profesor [Admin]' })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Busqueda por nombre, apellido o correo',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Pagina (por defecto 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite por pagina (por defecto 20, maximo 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de estudiantes elegibles para promocion',
  })
  async listStudentsCandidates(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    items: Array<{
      id: number;
      name: string;
      lastname: string;
      email: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    return await this.usersService.listStudentCandidatesForTeacherPromotion(
      q,
      Number(page),
      Number(limit),
    );
  }

  @Get('admin/students')
  @ApiOperation({
    summary:
      'Listar estudiantes para gestion [Admin] (DEPRECATED: usar /users/teacher/students)',
    deprecated: true,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Busqueda por nombre, apellido o correo',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Pagina (por defecto 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite por pagina (por defecto 20, maximo 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de estudiantes activos',
  })
  async listStudentsForAdmin(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    items: Array<{
      id: number;
      name: string;
      lastname: string;
      email: string;
      profile_image: string | null;
      role: string;
      is_active: boolean;
      assigned_classroom: {
        id: number;
        title: string;
        teacher: {
          id: number;
          name: string;
          lastname: string;
          profile_image: string | null;
        } | null;
      } | null;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    return await this.usersService.listStudentsForTeacherManagement(
      { id: 0, roles: [AuthRole.Admins] },
      q,
      Number(page),
      Number(limit),
    );
  }

  @ApiOperation({ summary: 'Assign a role to a user [Admin]' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @Post(':id/roles/:roleId/assign')
  async assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<SuccessResponseDto> {
    const result = await this.usersService.assignRole(id, roleId);
    return {
      success: result,
      message: 'Role assigned successfully',
    };
  }

  @ApiOperation({ summary: 'Revoke a role from a user [Admin]' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @Post(':id/roles/:roleId/revoke')
  async revokeRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<SuccessResponseDto> {
    const result = await this.usersService.revokeRole(id, roleId);
    return {
      success: result,
      message: 'Role revoked successfully',
    };
  }

  @ApiOperation({ summary: 'Promover estudiante a profesor [Admin]' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @Post(':id/promote-teacher')
  async promoteTeacher(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto> {
    const result = await this.usersService.promoteStudentToTeacher(id);
    return {
      success: result,
      message: 'User promoted to teacher successfully',
    };
  }

  @ApiOperation({ summary: 'Quitar rol de profesor y pasar a estudiante [Admin]' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @Post(':id/demote-to-student')
  async demoteTeacher(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto> {
    const result = await this.usersService.demoteTeacherToStudent(id);
    return {
      success: result,
      message: 'Teacher demoted to student successfully',
    };
  }

  @ApiOperation({ summary: 'Eliminar usuario (soft delete) [Admin]' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SuccessResponseDto> {
    const result = await this.usersService.softDeleteUser(id);
    return {
      success: result,
      message: 'User deleted successfully',
    };
  }
}
