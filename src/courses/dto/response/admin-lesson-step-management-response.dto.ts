import { ApiProperty } from '@nestjs/swagger';

export class AdminLessonStepManagementItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 'Que es la Seguridad Informatica?' })
  title: string;

  @ApiProperty({ example: 'Concepto general de seguridad informatica' })
  description: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: 1 })
  lesson_id: number;

  @ApiProperty({ example: 'Introduccion a la Seguridad Informatica' })
  lesson_title: string;

  @ApiProperty({ example: 1 })
  course_id: number;

  @ApiProperty({ example: 'Fundamentos de la seguridad informatica' })
  course_title: string;

  @ApiProperty({ example: 'THEORY' })
  step_type_code: string;

  @ApiProperty({ example: 'Feedback de respuesta correcta', nullable: true })
  responses: string | null;

  @ApiProperty({ example: '/public/lesson-steps/1717474000-abc123.gif', nullable: true })
  media_url: string | null;

  @ApiProperty({ example: 'gif', nullable: true })
  media_type: 'image' | 'gif' | null;
}

export class AdminLessonStepManagementResponseDto {
  @ApiProperty({ type: [AdminLessonStepManagementItemDto] })
  items: AdminLessonStepManagementItemDto[];

  @ApiProperty({ example: 20 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
