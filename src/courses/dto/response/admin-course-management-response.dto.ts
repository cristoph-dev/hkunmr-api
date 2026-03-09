import { ApiProperty } from '@nestjs/swagger';

export class AdminCourseManagementItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Introduccion a la seguridad informatica' })
  title: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({ example: 7 })
  lessons_count: number;

  @ApiProperty({ example: 2 })
  enrolled_users_count: number;
}

export class AdminCourseManagementResponseDto {
  @ApiProperty({ type: [AdminCourseManagementItemDto] })
  items: AdminCourseManagementItemDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
