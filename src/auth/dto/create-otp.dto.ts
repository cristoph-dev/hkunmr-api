import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { OTPEnum } from '../types/otp-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOtpDto {
  @ApiProperty({
    example: 'usuario@example.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    enum: OTPEnum,
    example: OTPEnum.VERIFICATION,
    description: 'Tipo de OTP a generar',
  })
  @IsEnum(OTPEnum)
  @IsNotEmpty()
  type: OTPEnum;
}
