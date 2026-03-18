import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateClassroomDto {
  @ApiProperty({
    example: 'Salon aula presencial',
    description: 'Nombre del salon',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    example: 'SGI-01',
    description: 'Codigo unico del salon (si no se envia, se autogenera)',
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  code?: string;

  @ApiPropertyOptional({
    example: [3, 5, 7],
    description: 'IDs de estudiantes elegibles para agregar al salon',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  student_ids?: number[];
}
