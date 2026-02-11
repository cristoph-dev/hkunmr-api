import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 1, description: 'Posición del curso' })
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
