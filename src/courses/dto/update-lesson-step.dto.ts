import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateLessonStepDto {
  @ApiPropertyOptional({ example: 'Teoriaaaaaa' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 'Teoria' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  lesson_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Validacion opcional de curso' })
  @IsOptional()
  @IsInt()
  @Min(1)
  course_id?: number;

  @ApiPropertyOptional({ example: 'THEORY' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  step_type_code?: string;

  @ApiPropertyOptional({ example: 'Prompt del paso' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({ example: 'Solucion del paso' })
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiPropertyOptional({ example: ['A', 'B'], type: [String] })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional({
    example: 'Explicacion breve de por que la respuesta correcta es verdadera',
  })
  @IsOptional()
  @IsString()
  responses?: string;

  @ApiPropertyOptional({ example: '', description: 'Campo reservado para futuros tipos de paso' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: '/public/lesson-steps/abc.png' })
  @IsOptional()
  @IsString()
  media_url?: string;

  @ApiPropertyOptional({ example: 'image', enum: ['image', 'gif'] })
  @IsOptional()
  @IsString()
  media_type?: 'image' | 'gif';

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
