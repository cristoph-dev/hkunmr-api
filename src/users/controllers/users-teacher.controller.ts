import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { Teacher } from 'src/common/guards/role.guard';
import { AuthenticatedUser } from 'src/common/decorators/authenticated.decorator';
import type { UserPayload } from 'src/common/lib/types';
import { TeacherStudentsManagementResponseDto } from '../dto/response/teacher-students-management-response.dto';

@ApiTags('Users [Profesores]')
@ApiBearerAuth()
@Controller('users/teacher')
export class UsersTeacherController {
  constructor(private readonly usersService: UsersService) {}

  @Get('students')
  @Teacher()
  @ApiOperation({
    summary:
      'Listar estudiantes para gestion con salon y profesor asignado [Profesor]',
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
    description:
      'Listado paginado de estudiantes con su salon y profesor asignado cuando exista',
    type: TeacherStudentsManagementResponseDto,
  })
  async listStudentsForTeacherManagement(
    @AuthenticatedUser() user: UserPayload,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<TeacherStudentsManagementResponseDto> {
    return this.usersService.listStudentsForTeacherManagement(
      { id: user.id, roles: user.roles },
      q,
      Number(page),
      Number(limit),
    );
  }
}
