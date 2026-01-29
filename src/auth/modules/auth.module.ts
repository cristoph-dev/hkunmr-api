import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { OtpController } from '../controllers/otp.controller';

import { UsersModule } from '../../users/users.module';
import { MailModule } from '../../mail/mail.module';

import { LocalStrategy } from '../local.strategy';
import { JwtStrategy } from '../jwt.strategy';

import { Otp } from '../entities/otp.entity';
import { OtpService } from '../services/otp.service';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Otp]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '8d' },
      }),
    }),
  ],
  controllers: [AuthController, OtpController],
  providers: [AuthService, OtpService, LocalStrategy, JwtStrategy],
  exports: [JwtModule, OtpService],
})
export class AuthModule {}
