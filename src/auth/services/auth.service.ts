import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Usado por LocalStrategy
   */
  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return null;
    }

    // Nunca devolver password
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Usado por AuthController después del guard
   */
  async login(user: any) {
    const payload = {
      sub: user.id,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(username: string, password: string) {
    const existingUser = await this.usersService.findByUsername(username);

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      username,
      password: hashedPassword,
      is_active: true,
      email_verified: false,
    });

    const { password: _, ...result } = user;
    return result;
  }

}
