import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { OTPEnum } from '../auth/types/otp-type.enum';
import { OTP_EMAIL_TEMPLATES } from './constants/email-templates.constant';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) { }

    /**
     * Sends an OTP email based on the type
     */
    async sendOtpEmail(email: string, code: string, type: OTPEnum): Promise<void> {
        const { template, subject } = OTP_EMAIL_TEMPLATES[type];

        await this.mailerService.sendMail({
            to: email,
            subject,
            template,
            context: {
                code,
                email,
            },
        });
    }
}
