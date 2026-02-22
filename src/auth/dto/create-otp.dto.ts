import { IsEnum, IsNotEmpty } from 'class-validator';
import { OTPEnum } from '../types/otp-type.enum';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { EmailDto } from 'src/common/dto/email.dto';

class OtpTypeDto {
  @ApiProperty({
    enum: OTPEnum,
    example: OTPEnum.VERIFICATION,
    description: 'Tipo de OTP a generar',
  })
  @IsEnum(OTPEnum)
  @IsNotEmpty()
  type: OTPEnum;
}

export class CreateOtpDto extends IntersectionType(EmailDto, OtpTypeDto) {}
