import { Controller, Post, UseGuards, Request, Body, Get } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiTags, ApiResponse } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../local-auth.guard';
import { RegisterDto } from '../dto/register.dto';
import type { AuthenticatedRequest } from 'src/lib/types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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
  async login(@Request() req: AuthenticatedRequest) {
    // req.user viene desde LocalStrategy
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({
    description: 'Datos de registro',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'usuario' },
        password: { type: 'string', example: 'contrasenia123' },
        email: { type: 'string', example: 'usuario@unimar.edu.ve' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Usuario creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o usuario ya existe' })
  async register(@Body() registerDto: RegisterDto) {
    const { username, password, email } = registerDto;
    return this.authService.register(username, password, email);
  }
}
