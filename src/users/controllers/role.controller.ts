import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleService } from '../services/role.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { Role } from '../entities';

import { UpdateRoleDto } from '../dto/update-role.dto';
import { Admin } from 'src/common/guards/role.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('roles')
@ApiBearerAuth()
@Admin()
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(@Body() data: CreateRoleDto): Promise<Role> {
    return this.roleService.create(data);
  }

  @Get()
  async findAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<Role | null> {
    return this.roleService.findById(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return this.roleService.delete(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() data: UpdateRoleDto,
  ): Promise<Role> {
    return this.roleService.update(id, data);
  }
}
