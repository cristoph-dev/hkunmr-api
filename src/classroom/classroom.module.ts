import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Classroom } from './entities/classroom.entity';
import { ClassroomService } from './services/classroom.service';
import { ClassroomController } from './controllers/classroom.controller';
import { User } from 'src/users/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Classroom, User])],
  controllers: [ClassroomController],
  providers: [ClassroomService],
  exports: [ClassroomService],
})
export class ClassroomModule {}
