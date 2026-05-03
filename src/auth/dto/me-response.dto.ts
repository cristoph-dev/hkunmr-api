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

  @ApiProperty({
    example: '/public/profile-images/1712600000000-123456789.jpg',
    description: 'URL relativa de la imagen de perfil del usuario',
    nullable: true,
    required: false,
  })
  profile_image?: string | null;
}
