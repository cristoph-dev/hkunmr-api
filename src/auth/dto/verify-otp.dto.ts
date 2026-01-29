import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { OTPEnum } from '../types/otp-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'usuario@example.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

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
    enum: OTPEnum,
    example: OTPEnum.VERIFICATION,
    description: 'Tipo de OTP a verificar',
  })
  @IsEnum(OTPEnum)
  @IsNotEmpty()
  type: OTPEnum;
}
