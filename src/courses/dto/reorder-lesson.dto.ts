import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ReorderLessonDto {
  @ApiProperty({
    example: 2,
    description: 'Nuevo orden de la leccion dentro del curso destino',
  })
  @IsInt()
  @Min(1)
  order: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Curso destino (opcional). Si no se envia, mantiene el curso actual',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  course_id?: number;
}
