import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClassroomService } from '../services/classroom.service';
import { AllRoles } from 'src/common/guards/role.guard';
import { AuthenticatedUser } from 'src/common/decorators/authenticated.decorator';
import type { UserPayload } from 'src/common/lib/types';

@ApiTags('Classrooms [Estudiantes]')
@ApiBearerAuth()
@Controller('classrooms')
export class ClassroomStudentController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Get('my')
  @AllRoles()
  @ApiOperation({ summary: 'Listar salones visibles [Todos los roles]' })
  @ApiResponse({ status: 200, description: 'Listado de salones' })
  listMine(
    @AuthenticatedUser() user: UserPayload,
  ): Promise<
    Array<{
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
      students_count: number;
    }>
  > {
    return this.classroomService.listMine(user);
  }

  @Get(':id/members')
  @AllRoles()
  @ApiOperation({
    summary: 'Ver profesor y companeros del salon [Todos los roles]',
  })
  @ApiResponse({ status: 200, description: 'Datos del salon con sus miembros' })
  getMembers(
    @Param('id', ParseIntPipe) classroomId: number,
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
    return this.classroomService.getMembers(classroomId, user);
  }

  @Get(':id/podium')
  @AllRoles()
  @ApiOperation({
    summary: 'Podio por salon usando medallas actuales [Todos los roles]',
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
      profile_image: string | null;
      medals: number;
    }>;
  }> {
    return this.classroomService.getPodium(classroomId, user);
  }
}
