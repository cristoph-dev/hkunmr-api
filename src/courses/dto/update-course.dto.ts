import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 1, description: 'Posición del curso' })
  @IsOptional()
  @IsNumber()
  position?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado activo del curso',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
