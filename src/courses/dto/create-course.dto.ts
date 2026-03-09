import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Fundamentos de Ciberseguridad',
    description: 'Titulo del curso',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 1, description: 'Posicion del curso' })
  @IsNumber()
  position: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado activo del curso',
    default: true,
  })
  @IsBoolean()
  is_active?: boolean;
}
