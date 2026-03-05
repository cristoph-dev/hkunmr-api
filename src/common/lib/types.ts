import { Request } from 'express';

export interface UserPayload {
  id: number;
  email: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}
