import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OtpService } from '../services/otp.service';
import { CreateOtpDto } from '../dto/create-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

@ApiTags('auth')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar y enviar un código OTP' })
  @ApiResponse({ status: 200, description: 'Enviado correctamente' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  async generateOTP(@Body() createOtpDto: CreateOtpDto) {
    await this.otpService.sendOTP(createOtpDto.email, createOtpDto.type);

    return {
      message: 'Ok',
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar un código OTP' })
  @ApiResponse({ status: 200, description: 'Código verificado correctamente' })
  @ApiResponse({
    status: 400,
    description: 'Código inválido o error en la solicitud',
  })
  @ApiResponse({ status: 401, description: 'Código expirado' })
  @ApiResponse({ status: 404, description: 'No se encontró un OTP válido' })
  async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto) {
    const isValid = await this.otpService.verifyOTP(
      verifyOtpDto.email,
      verifyOtpDto.code,
      verifyOtpDto.type,
    );

    return {
      message: 'Ok',
      verified: isValid,
    };
  }
}
