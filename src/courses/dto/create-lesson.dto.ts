import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 'Introduccion a Linux' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'Comandos basicos y navegacion en terminal' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 1, description: 'Orden de la leccion dentro del curso' })
  @IsInt()
  order: number;

  @ApiProperty({ example: 2, description: 'ID del curso al que pertenece la leccion' })
  @IsInt()
  course_id: number;
}
