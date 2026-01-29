import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { OTPEnum } from '../types/otp-type.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly dataSource: DataSource,
  ) { }

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

    if (user.is_active === false || user.email_verified === false) {
      throw new BadRequestException('Email not verified');
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
      email: user.email,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(username: string, password: string, email: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await this.usersService.findByUsernameOrEmail(username, email);

      if (existingUser) {
        if (existingUser.username === username) throw new BadRequestException('El nombre de usuario ya está registrado');
        if (existingUser.email === email) throw new BadRequestException('El correo electrónico ya está registrado');
        throw new BadRequestException('El usuario o correo ya existe');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.usersService.create({
        username,
        email,
        password: hashedPassword,
        is_active: true,
        email_verified: false,
      }, queryRunner.manager);

      await this.otpService.sendOTP(email, OTPEnum.VERIFICATION);

      await queryRunner.commitTransaction();

      const { password: _, ...result } = user;
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

}
