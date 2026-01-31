import { PickType } from '@nestjs/swagger';
import { VerifyOtpDto } from './verify-otp.dto';

export class ForgotPasswordDto extends PickType(VerifyOtpDto, [
  'email',
] as const) {}
