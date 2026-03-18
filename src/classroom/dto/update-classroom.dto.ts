import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateClassroomDto {
  @ApiPropertyOptional({
    example: 'Salon aula virtual',
    description: 'Nombre del salon',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'SGI-02',
    description: 'Codigo unico del salon',
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  code?: string;

  @ApiPropertyOptional({
    example: 4,
    description: 'ID del profesor a asignar al salon',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  teacher_id?: number;

  @ApiPropertyOptional({
    example: [3, 5, 7],
    description:
      'IDs de estudiantes del salon (si se envia, reemplaza el listado completo)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  student_ids?: number[];
}
