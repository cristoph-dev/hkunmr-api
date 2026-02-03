import { Request } from 'express';

export interface UserPayload {
  id: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}
