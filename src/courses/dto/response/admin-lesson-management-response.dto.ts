import { ApiProperty } from '@nestjs/swagger';

export class AdminLessonManagementItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Introduccion a la Seguridad Informatica' })
  title: string;

  @ApiProperty({ example: 'Conceptos fundamentales de seguridad' })
  description: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: 1 })
  course_id: number;

  @ApiProperty({ example: 'Fundamentos de la seguridad informatica' })
  course_title: string;

  @ApiProperty({ example: 9 })
  steps_count: number;
}

export class AdminLessonManagementResponseDto {
  @ApiProperty({ type: [AdminLessonManagementItemDto] })
  items: AdminLessonManagementItemDto[];

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
