import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLessonStepDto {
  @ApiProperty({ example: 'Teoriaaaaaa' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'Teoria' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  lesson_id: number;

  @ApiPropertyOptional({ example: 1, description: 'Validacion opcional de curso' })
  @IsOptional()
  @IsInt()
  @Min(1)
  course_id?: number;

  @ApiProperty({ example: 'THEORY' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  step_type_code: string;

  @ApiPropertyOptional({ example: 'Prompt del paso', default: '' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({ example: 'Solucion del paso', default: '' })
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiPropertyOptional({ example: ['A', 'B'], type: [String], default: [] })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional({
    example: 'Explicacion breve de por que la respuesta correcta es verdadera',
    default: '',
  })
  @IsOptional()
  @IsString()
  responses?: string;

  @ApiPropertyOptional({ example: '', description: 'Campo reservado para futuros tipos de paso' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: '/public/lesson-steps/abc.png', default: '' })
  @IsOptional()
  @IsString()
  media_url?: string;

  @ApiPropertyOptional({ example: 'image', enum: ['image', 'gif'] })
  @IsOptional()
  @IsString()
  media_type?: 'image' | 'gif';

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
