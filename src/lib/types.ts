import { Request } from 'express';

export interface UserPayload {
    userId: number;
    username: string;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user: UserPayload;
}