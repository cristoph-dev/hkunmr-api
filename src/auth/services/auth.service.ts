import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from 'src/users/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { OTPEnum } from '../types/otp-type.enum';
import * as bcrypt from 'bcrypt';
import { UserPayload } from 'src/common/lib/types';
import { User } from 'src/users/entities';
import { LoginResponseDto } from '../dto/login-response.dto';
import { ConfigService } from '@nestjs/config';
import { EmailDomain } from 'src/common/lib/const';
import {
  RegistrationPayload,
  ResetPayload,
} from '../types/registration-payload.interface';

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

  private async generateRegistrationToken(
    payload: RegistrationPayload,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: '5m',
      secret: this.configService.get<string>('JWT_REGISTER_SECRET'),
    });
  }

  private async generateResetToken(payload: ResetPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: '5m',
      secret: this.configService.get<string>('JWT_REGISTER_SECRET'),
    });
  }

  /**
   * Usado por LocalStrategy
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
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
    name: string,
    lastname: string,
    email: string,
    password: string,
  ): Promise<{ registrationToken: string; expires: string }> {
    this.validateEmail(email);

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otpUuid = await this.otpService.sendOTP(email, OTPEnum.VERIFICATION);

    const registrationToken = await this.generateRegistrationToken({
      name,
      lastname,
      email,
      password: hashedPassword,
      otpUuid,
    });

    return { registrationToken, expires: '5m' };
  }

  async forgotPassword(
    email: string,
  ): Promise<{ resetToken: string; expires: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.validateEmail(email);

      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new BadRequestException();
      }

      const otpUuid = await this.otpService.sendOTP(
        email,
        OTPEnum.PASSWORD_CHANGE,
      );

      const resetToken = await this.generateResetToken({
        email,
        otpUuid,
      });

      await queryRunner.commitTransaction();

      return { resetToken, expires: '5m' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async resetPassword(
    resetToken: string,
    code: string,
    password: string,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let payload: ResetPayload;
      try {
        payload = await this.jwtService.verifyAsync(resetToken, {
          secret: this.configService.get<string>('JWT_REGISTER_SECRET'),
        });
      } catch (e) {
        console.error(e);
        throw new BadRequestException('Invalid or expired reset token');
      }

      const user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        throw new BadRequestException();
      }

      const isValid = await this.otpService.verifyOTPByUuid(
        payload.otpUuid,
        code,
        OTPEnum.PASSWORD_CHANGE,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid code');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await this.usersService.updatePassword(
        payload.email,
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

  async verifyUser(code: string, registrationToken: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payload: RegistrationPayload = await this.jwtService.verifyAsync(
        registrationToken,
        {
          secret: this.configService.get<string>('JWT_REGISTER_SECRET'),
        },
      );

      const isValid = await this.otpService.verifyOTPByUuid(
        payload.otpUuid,
        code,
        OTPEnum.VERIFICATION,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid code');
      }

      const existingUser = await this.usersService.findByEmail(payload.email);
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      await this.usersService.create(
        {
          name: payload.name,
          lastname: payload.lastname,
          email: payload.email,
          password: payload.password,
          is_active: true,
          email_verified: true,
        },
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
      email: user.email,
    });
  }
}
