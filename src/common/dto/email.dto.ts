import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailDto {
  @ApiProperty({
    example: 'usuario@correo.com',
    description: 'Correo electronico del usuario',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
