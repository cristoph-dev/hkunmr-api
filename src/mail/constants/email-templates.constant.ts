import { OTPEnum } from '../../auth/types/otp-type.enum';
import { EmailTemplate } from '../types/index';

export const OTP_EMAIL_TEMPLATES: Record<OTPEnum, EmailTemplate> = {
  [OTPEnum.VERIFICATION]: {
    template: './auth/verification',
    subject: 'Verificar correo electrónico',
  },
  [OTPEnum.PASSWORD_CHANGE]: {
    template: './auth/password-change',
    subject: 'Confirmación de cambio de contraseña',
  },
};
