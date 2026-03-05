import { Controller, Post, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Admin } from 'src/common/guards/role.guard';
import { SuccessResponseDto } from 'src/common/dto';

@ApiTags('users')
@ApiBearerAuth()
@Admin()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Assign a role to a user' })
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

  @ApiOperation({ summary: 'Revoke a role from a user' })
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
}
