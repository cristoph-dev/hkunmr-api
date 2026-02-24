import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiBody, ApiTags, ApiResponse } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import {
  RegisterDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LoginResponseDto,
  RefreshTokenDto,
} from '../dto';
import type { AuthenticatedRequest } from 'src/common/lib/types';
import { User } from 'src/users/entities';
import { SuccessResponseDto } from '@common/dto';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';

import { Public } from 'src/common/decorators/public.decorator';

@Public()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con credenciales de usuario' })
  @ApiBody({
    description: 'Credenciales de inicio de sesión',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'usuario/correo' },
        password: { type: 'string', example: 'contrasenia123' },
      },
    },
  })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  async login(@Request() req: AuthenticatedRequest): Promise<LoginResponseDto> {
    // req.user viene desde LocalStrategy
    console.log(req.user);
    return await this.authService.login(req.user as unknown as User);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar tokens' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  async refresh(
    @Request() req: AuthenticatedRequest & { user: { refreshToken: string } },
    @Body() _refreshTokenDto: RefreshTokenDto,
  ): Promise<LoginResponseDto> {
    return await this.authService.refreshToken(
      req.user.id,
      req.user.refreshToken,
    );
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({
    status: 201,
    schema: { properties: { registrationToken: { type: 'string' } } },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o usuario ya existe',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ registrationToken: string; expires: string }> {
    const { name, lastname, email, password } = registerDto;

    return this.authService.register(name, lastname, email, password);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar un código OTP' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Código inválido o error en la solicitud',
  })
  @ApiResponse({ status: 401, description: 'Código expirado' })
  @ApiResponse({ status: 404, description: 'Código no válido' })
  async verifyOTP(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<SuccessResponseDto> {
    const isValid = await this.authService.verifyUser(
      verifyOtpDto.code,
      verifyOtpDto.registrationToken,
    );

    return {
      message: 'Ok',
      success: isValid,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Olvidar contraseña' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Código inválido o error en la solicitud',
  })
  @ApiResponse({ status: 401, description: 'Código expirado' })
  @ApiResponse({ status: 404, description: 'Código no válido' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<SuccessResponseDto & { resetToken?: string; expires?: string }> {
    const result = await this.authService.forgotPassword(
      forgotPasswordDto.email,
    );

    return {
      message: 'Ok',
      success: !!result,
      ...result,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña' })
  @ApiResponse({ status: 200, type: SuccessResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Código inválido o error en la solicitud',
  })
  @ApiResponse({ status: 401, description: 'Código expirado' })
  @ApiResponse({ status: 404, description: 'Código no válido' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<SuccessResponseDto> {
    const isValid = await this.authService.resetPassword(
      resetPasswordDto.resetToken,
      resetPasswordDto.code,
      resetPasswordDto.password,
    );

    return {
      message: 'Ok',
      success: isValid,
    };
  }
}
