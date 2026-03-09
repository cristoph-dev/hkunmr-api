import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: 'Christopher', description: 'Nombre del usuario' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'Perez', description: 'Apellido del usuario' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastname?: string;
}
