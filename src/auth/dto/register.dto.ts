import {
  IsNotEmpty,
  IsString,
  IsEmail,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'usuario',
    description: 'Nombre de usuario único',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  username: string;

  @ApiProperty({
    example: 'usuario@unimar.edu.ve',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail()
  @IsNotEmpty()
  @Matches(/^[^\s@]+@unimar\.edu\.ve$/, {
    message: 'El correo electrónico debe pertenecer al dominio @unimar.edu.ve',
  })
  email: string;

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
