import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LessonStepResponseDto {
  @ApiProperty({ example: 1, description: 'ID del paso' })
  id: number;

  @ApiProperty({ example: '¿Qué es MRI?', description: 'Título del paso' })
  title: string;

  @ApiProperty({
    example: 'Explicación básica de MRI',
    description: 'Descripción del paso',
  })
  description: string;

  @ApiProperty({ example: 1, description: 'Orden del paso' })
  order: number;

  @ApiProperty({
    example: '¿Qué significa MRI?',
    description: 'Pregunta o prompt',
  })
  prompt: string;

  @ApiProperty({
    example: 'Magnetic Resonance Imaging',
    description: 'Solución correcta',
  })
  solution: string;

  @ApiProperty({
    example: '["Opción 1", "Opción 2", "Opción 3"]',
    description: 'Opciones de respuesta en formato JSON',
  })
  options: string;

  @ApiPropertyOptional({
    example: '/public/lesson-steps/1717474000-abc123.gif',
    description: 'URL relativa del recurso visual (imagen o gif)',
  })
  media_url?: string | null;

  @ApiPropertyOptional({
    example: 'gif',
    description: 'Tipo de recurso visual asociado al paso',
  })
  media_type?: 'image' | 'gif' | null;

  @ApiProperty({ example: true, description: 'Estado activo del paso' })
  is_active: boolean;

  @ApiProperty({ example: 1, description: 'ID de la lección' })
  lesson_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID del tipo de paso de lección',
  })
  lesson_step_type_id: number;

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
