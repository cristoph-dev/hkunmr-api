import { ApiProperty } from '@nestjs/swagger';

export class CourseResponseDto {
  @ApiProperty({ example: 1, description: 'ID del curso' })
  id: number;

  @ApiProperty({ example: 1, description: 'Posición del curso' })
  position: number;

  @ApiProperty({ example: true, description: 'Estado activo del curso' })
  is_active: boolean;

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
