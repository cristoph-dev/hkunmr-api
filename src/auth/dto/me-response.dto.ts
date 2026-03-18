import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty({ example: 'Christopher', description: 'Nombre del usuario' })
  name: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario' })
  lastname: string;

  @ApiProperty({ example: 'Administrador', description: 'Rol principal del usuario' })
  role: string;

  @ApiProperty({
    example: 57,
    description: 'Puntos acumulados del usuario (suma de medallas ganadas)',
  })
  points: number;
}
