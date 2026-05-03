import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { User, Role } from './entities';
import { UsersGeneralController } from './controllers/users.controller';
import { UsersAdminController } from './controllers/users-admin.controller';
import { UsersTeacherController } from './controllers/users-teacher.controller';
import { RoleController } from './controllers/role.controller';
import { RoleService } from './services/role.service';
import { Classroom } from 'src/classroom/entities/classroom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Classroom])],
  providers: [UsersService, RoleService],
  controllers: [UsersGeneralController, UsersAdminController, UsersTeacherController, RoleController],
  exports: [UsersService],
})
export class UsersModule {}
