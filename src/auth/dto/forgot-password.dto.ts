import { IsEmail, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'usuario@example.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail()
  @Matches(/^[^\s@]+@unimar\.edu\.ve$/, {
    message: 'El correo electrónico debe pertenecer al dominio @unimar.edu.ve',
  })
  @IsNotEmpty()
  email: string;
}
