import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class EmailDto {
  @ApiProperty({
    example: 'usuario@unimar.edu.ve',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail()
  @Matches(/^[^\s@]+@unimar\.edu\.ve$/, {
    message: 'El correo electrónico debe pertenecer al dominio @unimar.edu.ve',
  })
  @IsNotEmpty()
  email: string;
}
