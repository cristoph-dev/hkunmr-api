import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { OTPEnum } from '../types/otp-type.enum';
import * as bcrypt from 'bcrypt';
import { UserPayload } from 'src/lib/types';
import { User } from '../../users/entities/user.entity';
import { LoginResponseDto } from '../dto/login-response.dto';
import { ConfigService } from '@nestjs/config';
import { EmailDomain } from 'src/lib/const';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private async generateTokens(
    payload: UserPayload,
  ): Promise<LoginResponseDto> {
    const jwtPayload = {
      sub: payload.id,
      email: payload.email,
      username: payload.username,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        expiresIn: '8d',
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      }),
      this.jwtService.signAsync(jwtPayload, {
        expiresIn: '7d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Usado por LocalStrategy
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.password!);

    if (!passwordValid) {
      return null;
    }

    if (user.is_active === false || user.email_verified === false) {
      throw new BadRequestException('Email not verified');
    }

    delete user.password;

    return user;
  }

  /**
   * Usado por AuthController después del guard
   */
  async login(user: UserPayload): Promise<LoginResponseDto> {
    return this.generateTokens(user);
  }

  private validateEmail(email: string): void {
    if (!email.endsWith('@' + EmailDomain)) {
      throw new BadRequestException(
        'El correo electrónico debe pertenecer al dominio @' + EmailDomain,
      );
    }
  }

  async register(
    username: string,
    password: string,
    email: string,
  ): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.validateEmail(email);

      const existingUser = await this.usersService.findByUsernameOrEmail(
        username,
        email,
      );

      if (existingUser) {
        if (existingUser.username === username)
          throw new BadRequestException(
            'El nombre de usuario ya está registrado',
          );
        if (existingUser.email === email)
          throw new BadRequestException(
            'El correo electrónico ya está registrado',
          );
        throw new BadRequestException('El usuario o correo ya existe');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.usersService.create(
        {
          username,
          email,
          password: hashedPassword,
          is_active: true,
          email_verified: false,
        },
        queryRunner.manager,
      );

      await this.otpService.sendOTP(email, OTPEnum.VERIFICATION);

      await queryRunner.commitTransaction();

      delete user.password;

      return user;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.validateEmail(email);

      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new BadRequestException();
      }

      await this.otpService.sendOTP(email, OTPEnum.PASSWORD_CHANGE);

      await queryRunner.commitTransaction();

      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async resetPassword(
    email: string,
    code: string,
    password: string,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.validateEmail(email);

      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new BadRequestException();
      }

      const isValid = await this.otpService.verifyOTP(
        email,
        code,
        OTPEnum.PASSWORD_CHANGE,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid code');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await this.usersService.updatePassword(
        email,
        hashedPassword,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyUser(email: string, code: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.validateEmail(email);
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new BadRequestException();
      }

      const isValid = await this.otpService.verifyOTP(
        email,
        code,
        OTPEnum.VERIFICATION,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid code');
      }

      await this.usersService.activateUser(email, queryRunner.manager);

      await queryRunner.commitTransaction();

      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async refreshToken(
    userId: number,
    _refreshToken: string,
  ): Promise<LoginResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  }
}
