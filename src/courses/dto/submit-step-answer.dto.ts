import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class SubmitStepAnswerDto {
  @ApiProperty({
    example: 'true',
    description: 'Respuesta del usuario para steps de respuesta unica',
    required: false,
  })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiProperty({
    example: ['Amenaza', 'Vulnerabilidad', 'Riesgo'],
    description: 'Respuestas del usuario para steps de respuesta multiple',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  answers?: string[];
}
