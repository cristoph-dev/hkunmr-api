import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { OtpController } from '../controllers/otp.controller';

import { UsersModule } from '../../users/users.module';
import { MailModule } from '../../mail/mail.module';

import { LocalStrategy } from '../strategies/local.strategy';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtRefreshStrategy } from '../strategies/jwt-refresh.strategy';

import { Otp } from '../entities/otp.entity';
import { OtpService } from '../services/otp.service';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Otp]),
    JwtModule.register({}),
  ],
  controllers: [AuthController, OtpController],
  providers: [
    AuthService,
    OtpService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [JwtModule, OtpService],
})
export class AuthModule {}
