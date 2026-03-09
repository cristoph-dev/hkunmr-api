import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({
    example: 'Fundamentos de Ciberseguridad',
    description: 'Titulo del curso',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 1, description: 'Posicion del curso' })
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
