import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { User, Role } from './entities';
import { UsersController } from './controllers/users.controller';
import { RoleController } from './controllers/role.controller';
import { RoleService } from './services/role.service';
import { Classroom } from 'src/classroom/entities/classroom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Classroom])],
  providers: [UsersService, RoleService],
  controllers: [UsersController, RoleController],
  exports: [UsersService],
})
export class UsersModule {}
