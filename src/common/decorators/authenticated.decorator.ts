import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../lib/types';

/**
 * Decorator to get the authenticated user from the request.
 */
export const AuthenticatedUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        console.log('request', request);
        return request.user;
    },
);
