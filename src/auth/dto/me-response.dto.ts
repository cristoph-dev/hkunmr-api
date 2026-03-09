import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty({ example: 'Christopher', description: 'Nombre del usuario' })
  name: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario' })
  lastname: string;

  @ApiProperty({ example: 'Administrador', description: 'Rol principal del usuario' })
  role: string;
}
