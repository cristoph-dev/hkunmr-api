import { ApiProperty } from '@nestjs/swagger';
import { CourseScope } from '../../entities/course.entity';

export class CourseResponseDto {
  @ApiProperty({ example: 1, description: 'ID del curso' })
  id: number;

  @ApiProperty({
    example: 'Fundamentos de Ciberseguridad',
    description: 'Titulo del curso',
  })
  title: string;

  @ApiProperty({ example: 1, description: 'Posicion del curso' })
  position: number;

  @ApiProperty({ example: true, description: 'Estado activo del curso' })
  is_active: boolean;

  @ApiProperty({ enum: CourseScope, example: CourseScope.NATIVE })
  scope: CourseScope;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'ID del autor del curso (solo cursos de profesor)',
  })
  author_id: number | null;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Fecha de creacion',
  })
  created_at: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Fecha de ultima actualizacion',
  })
  updated_at: Date;
}
