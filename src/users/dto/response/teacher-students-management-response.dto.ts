import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeacherStudentsManagementAssignedClassroomTeacherDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'Professor' })
  name: string;

  @ApiProperty({ example: 'User' })
  lastname: string;

  @ApiPropertyOptional({
    example: '/public/profile-images/1712600000000-123456789.jpg',
    nullable: true,
  })
  profile_image: string | null;
}

export class TeacherStudentsManagementAssignedClassroomDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Aula 3A' })
  title: string;

  @ApiPropertyOptional({
    type: TeacherStudentsManagementAssignedClassroomTeacherDto,
    nullable: true,
  })
  teacher: TeacherStudentsManagementAssignedClassroomTeacherDto | null;
}

export class TeacherStudentsManagementItemDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 'Student' })
  name: string;

  @ApiProperty({ example: 'User' })
  lastname: string;

  @ApiProperty({ example: 'student@unimar.edu.ve' })
  email: string;

  @ApiPropertyOptional({
    example: '/public/profile-images/1712600000000-123456789.jpg',
    nullable: true,
  })
  profile_image: string | null;

  @ApiProperty({ example: 'Estudiante' })
  role: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({
    type: TeacherStudentsManagementAssignedClassroomDto,
    nullable: true,
  })
  assigned_classroom: TeacherStudentsManagementAssignedClassroomDto | null;
}

export class TeacherStudentsManagementResponseDto {
  @ApiProperty({ type: [TeacherStudentsManagementItemDto] })
  items: TeacherStudentsManagementItemDto[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
