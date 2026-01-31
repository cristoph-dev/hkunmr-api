import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Otp } from '../entities/otp.entity';
import { OTPEnum } from '../types/otp-type.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from '../../mail/mail.service';
import * as crypto from 'crypto';
import { ErrorMessages } from 'src/lib/const';

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRATION_MINUTES = 10;
  private readonly MAX_OTP_ATTEMPTS = 3;
  private readonly RATE_LIMIT_MINUTES = 15;

  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Generates and stores a new OTP for the given email and type
   * Returns the plain OTP code to be sent via email
   */
  async generateOTP(email: string, type: OTPEnum): Promise<string> {
    const queryRunner =
      this.otpRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const rateLimitTime = new Date(
        now.getTime() - this.RATE_LIMIT_MINUTES * 60 * 1000,
      );

      let otp = await queryRunner.manager.findOne(Otp, {
        where: { email, type },
        order: { created: 'DESC' },
      });

      if (otp) {
        // Reset attempts if the last one was outside the rate limit window
        if (otp.created < rateLimitTime) {
          otp.attempts = 0;
        }

        if (otp.attempts >= this.MAX_OTP_ATTEMPTS) {
          throw new HttpException(
            ErrorMessages.ErrTooManyAttempts,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        otp.attempts += 1;
      } else {
        otp = queryRunner.manager.create(Otp, {
          email,
          type,
          attempts: 1,
        });
      }

      const code = crypto.randomInt(100000, 1000000).toString();
      const hashedCode = await bcrypt.hash(code, 10);

      const expires = new Date(
        now.getTime() + this.OTP_EXPIRATION_MINUTES * 60 * 1000,
      );

      otp.code = hashedCode;
      otp.expires = expires;
      otp.verified = false;
      otp.created = now;

      await queryRunner.manager.save(Otp, otp);
      await queryRunner.commitTransaction();

      return code;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Generates OTP and sends it via email
   */
  async sendOTP(email: string, type: OTPEnum): Promise<void> {
    const code = await this.generateOTP(email, type);
    await this.mailService.sendOtpEmail(email, code, type);
  }

  /**
   * Verifies an OTP code for the given email and type
   */
  async verifyOTP(
    email: string,
    code: string,
    type: OTPEnum,
  ): Promise<boolean> {
    const queryRunner =
      this.otpRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const otp = await queryRunner.manager.findOne(Otp, {
        where: {
          email,
          type,
          verified: false,
        },
        order: {
          created: 'DESC',
        },
      });

      if (!otp) {
        throw new BadRequestException('Invalid code');
      }

      if (new Date() > otp.expires) {
        throw new UnauthorizedException(ErrorMessages.ErrExpired);
      }

      const isValid = await bcrypt.compare(code, otp.code);

      if (!isValid) {
        throw new UnauthorizedException(ErrorMessages.ErrInvalid);
      }

      await this.invalidateOtp(email, type);

      await queryRunner.commitTransaction();

      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Marks an OTP as verified (used) for the given email and type
   */
  async invalidateOtp(email: string, type: OTPEnum): Promise<void> {
    await this.otpRepository.update(
      {
        email,
        type,
        verified: false,
      },
      {
        verified: true,
        attempts: 0,
      },
    );
  }

  /**
   * Cron job to clean up expired OTPs daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredOtps(): Promise<void> {
    const now = new Date();
    await this.otpRepository.delete({
      expires: LessThan(now),
    });
  }
}
