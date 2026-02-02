import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OtpService } from '../services/otp.service';
import { CreateOtpDto } from '../dto';
import { SuccessResponseDto } from '@common/dto';

@ApiTags('auth')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar y enviar un código OTP' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  async generateOTP(
    @Body() createOtpDto: CreateOtpDto,
  ): Promise<SuccessResponseDto> {
    await this.otpService.sendOTP(createOtpDto.email, createOtpDto.type);

    return {
      message: 'Ok',
      success: true,
    };
  }
}
