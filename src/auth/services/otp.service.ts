import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, EntityManager } from 'typeorm';
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
  private readonly COOLDOWN_SECONDS = 60;

  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly mailService: MailService,
  ) {}

  private checkCooldown(otp: Otp, now: Date) {
    const rateLimitTime = new Date(
      now.getTime() - this.RATE_LIMIT_MINUTES * 60 * 1000,
    );

    if (otp.created.getTime() < rateLimitTime.getTime()) {
      otp.attempts = 0;
    }

    const cooldownTime = new Date(
      otp.created.getTime() + this.COOLDOWN_SECONDS * 1000,
    );

    if (now.getTime() < cooldownTime.getTime()) {
      const secondsRemaining = Math.ceil(
        (cooldownTime.getTime() - now.getTime()) / 1000,
      );
      throw new HttpException(
        `Por favor, espera ${secondsRemaining} segundos antes de solicitar otro código`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Generates and stores a new OTP for the given email and type
   * Returns the OTP object
   */
  async generateOTP(email: string, type: OTPEnum): Promise<Otp> {
    const queryRunner =
      this.otpRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      let otp = await queryRunner.manager.findOne(Otp, {
        where: { email, type },
        order: { created: 'DESC' },
      });

      if (otp) {
        this.checkCooldown(otp, now);

        if (otp.attempts >= this.MAX_OTP_ATTEMPTS) {
          throw new HttpException(
            ErrorMessages.ErrTooManyAttempts,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        otp.attempts += 1;

        // Regenerate UUID to invalidate previous registration sessions for this email
        otp.uuid = crypto.randomUUID();
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

      const savedOtp = await queryRunner.manager.save(Otp, otp);
      await queryRunner.commitTransaction();

      savedOtp.plainCode = code;

      return savedOtp;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Generates OTP and sends it via email
   * Returns the OTP UUID
   */
  async sendOTP(email: string, type: OTPEnum): Promise<string> {
    const otp = await this.generateOTP(email, type);
    await this.mailService.sendOtpEmail(email, otp.plainCode!, type);
    return otp.uuid;
  }

  /**
   * Verifies an OTP code using its UUID
   */
  async verifyOTPByUuid(
    uuid: string,
    code: string,
    type: OTPEnum,
  ): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        uuid,
        type,
        verified: false,
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid code or expired session');
    }

    return this.verifyOtpRecord(otp.id, code);
  }

  private async verifyOtpRecord(otpId: number, code: string): Promise<boolean> {
    const queryRunner =
      this.otpRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const otp = await queryRunner.manager.findOne(Otp, {
        where: { id: otpId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!otp || otp.verified) {
        throw new BadRequestException('Invalid code or expired session');
      }

      if (new Date() > otp.expires) {
        throw new UnauthorizedException(ErrorMessages.ErrExpired);
      }

      const isValid = await bcrypt.compare(code, otp.code);

      if (!isValid) {
        // Track failed attempts even on unsuccessful verification
        otp.attempts += 1;
        if (otp.attempts >= this.MAX_OTP_ATTEMPTS) {
          otp.verified = true;
        }
        await queryRunner.manager.save(Otp, otp);
        await queryRunner.commitTransaction();
        throw new UnauthorizedException(ErrorMessages.ErrInvalid);
      }

      await this.invalidateOtp(otp.uuid, queryRunner.manager);

      await queryRunner.commitTransaction();

      return true;
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Marks an OTP as verified (used) by its UUID
   */
  async invalidateOtp(uuid: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Otp) : this.otpRepository;
    await repo.update(
      {
        uuid,
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
