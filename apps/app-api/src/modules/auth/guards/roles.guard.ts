import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from 'src/graphql/generated/graphql';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../auth.constants';
import type { GraphqlContext } from '../types/auth-context';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.isPublic(context)) {
      return true;
    }

    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const user = gqlContext.getContext<GraphqlContext>()?.req?.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (requiredRoles.includes(user.role)) {
      return true;
    }

    throw new ForbiddenException(
      `This action requires one of: ${requiredRoles.join(', ')}.`,
    );
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }
}
