import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: '123456',
    description: 'Código de 6 dígitos',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    description: 'Token de registro (requerido para verificación de cuenta)',
  })
  @IsString()
  @IsNotEmpty()
  registrationToken: string;
}
