import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UserIdDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario',
  })
  @IsNumber()
  userId: number;
}
