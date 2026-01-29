import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
    HttpException,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Otp } from '../entities/otp.entity';
import { OTPEnum } from '../types/otp-type.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from '../../mail/mail.service';
import { UsersService } from '../../users/users.service';
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
        private readonly usersService: UsersService,
    ) { }

    /**
     * Generates and stores a new OTP for the given email and type
     * Returns the plain OTP code to be sent via email
     */
    async generateOTP(email: string, type: OTPEnum): Promise<string> {
        const queryRunner = this.otpRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const rateLimitTime = new Date();
            rateLimitTime.setMinutes(rateLimitTime.getMinutes() - this.RATE_LIMIT_MINUTES);

            const recentOtps = await queryRunner.manager.count(Otp, {
                where: {
                    email,
                    type,
                    created: MoreThan(rateLimitTime),
                },
            });

            if (recentOtps >= this.MAX_OTP_ATTEMPTS) {
                throw new HttpException(
                    ErrorMessages.ErrTooManyAttempts,
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }

            await queryRunner.manager.update(
                Otp,
                {
                    email,
                    type,
                    verified: false,
                },
                {
                    verified: true,
                },
            );

            const code = crypto.randomInt(100000, 1000000).toString();
            const hashedCode = await bcrypt.hash(code, 10);

            const expires = new Date();
            expires.setMinutes(expires.getMinutes() + this.OTP_EXPIRATION_MINUTES);

            const otp = queryRunner.manager.create(Otp, {
                email,
                code: hashedCode,
                type,
                expires,
            });

            await queryRunner.manager.save(otp);
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
    async verifyOTP(email: string, code: string, type: OTPEnum): Promise<boolean> {
        const queryRunner = this.otpRepository.manager.connection.createQueryRunner();
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
