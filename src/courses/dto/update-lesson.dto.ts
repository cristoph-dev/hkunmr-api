import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 'Leccion actualizada' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 'Descripcion actualizada de la leccion' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ example: 1, description: 'Nuevo curso para la leccion' })
  @IsOptional()
  @IsInt()
  course_id?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
