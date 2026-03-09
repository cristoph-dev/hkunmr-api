import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserAdminDto {
  @ApiPropertyOptional({ example: 'Samuel', description: 'Nombre del usuario' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'Salazar', description: 'Apellido del usuario' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastname?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado activo del usuario',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
