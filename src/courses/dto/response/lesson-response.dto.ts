import { ApiProperty } from '@nestjs/swagger';

export class LessonResponseDto {
  @ApiProperty({ example: 1, description: 'ID de la lección' })
  id: number;

  @ApiProperty({
    example: 'Introducción a MRI',
    description: 'Título de la lección',
  })
  title: string;

  @ApiProperty({
    example: 'Aprende los fundamentos de resonancia magnética',
    description: 'Descripción de la lección',
  })
  description: string;

  @ApiProperty({ example: 1, description: 'Orden de la lección' })
  order: number;

  @ApiProperty({ example: true, description: 'Estado activo de la lección' })
  is_active: boolean;

  @ApiProperty({ example: 1, description: 'ID del curso' })
  course_id: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Fecha de creación',
  })
  created_at: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Fecha de última actualización',
  })
  updated_at: Date;
}
