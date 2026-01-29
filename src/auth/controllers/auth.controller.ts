import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiTags } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../local-auth.guard';
import { Body } from '@nestjs/common';

@ApiTags('authentication')
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
        username: { type: 'string', example: 'usuario@unimar.edu.ve' },
        password: { type: 'string', example: 'contrasenia123' },
      },
    },
  })
  async login(@Request() req) {
    // req.user viene desde LocalStrategy
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() body: any) {
    const { username, password } = body;
    return this.authService.register(username, password);
  }
}
