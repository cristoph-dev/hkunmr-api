import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerifyOtpDto } from './verify-otp.dto';

export class ResetPasswordDto extends VerifyOtpDto {
  @ApiProperty({
    example: 'contrasenia123',
    description: 'Contraseña del usuario',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
