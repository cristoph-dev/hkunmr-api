export interface RegistrationPayload {
  name: string;
  lastname: string;
  email: string;
  password: string; // Hashed password
  otpUuid: string;
}

export interface ResetPayload {
  email: string;
  otpUuid: string;
}
