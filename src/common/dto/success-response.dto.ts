import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto {
  @ApiProperty({ example: 'Ok' })
  message: string;

  @ApiProperty({ example: true })
  success: boolean;
}
