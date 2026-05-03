import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { intersect } from '../lib/utils';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../lib/types';

export const Roles = Reflector.createDecorator<AuthRole[]>();
export const Admin = () => Roles([AuthRole.Admins]);
export const Student = () => Roles([AuthRole.Student]);
export const Teacher = () => Roles([AuthRole.Teacher]);
export const AllRoles = () =>
  Roles([AuthRole.Admins, AuthRole.Student, AuthRole.Teacher]);

export enum AuthRole {
  Admins = 'Administrador',
  Student = 'Estudiante',
  Teacher = 'Profesor',
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const roles = this.reflector.getAllAndOverride<AuthRole[]>(Roles, targets);
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRoles: string[] = request.user?.roles || [];

    // Admin Bypass for every endpoint
    if (userRoles.includes(AuthRole.Admins)) {
      return true;
    }

    const isTeacher = userRoles.includes(AuthRole.Teacher);
    const endpointRequiresStudent = roles.includes(AuthRole.Student);

    if (isTeacher && endpointRequiresStudent) {
      return true;
    }

    return Boolean(intersect(userRoles, roles).length);
  }
}
