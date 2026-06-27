import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../auth.constants';
import type { AuthenticatedUser, GraphqlContext } from '../types/auth-context';

@Injectable()
export class GraphqlAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    if (this.isPublic(context)) {
      return true;
    }

    return super.canActivate(context);
  }

  override getRequest(context: ExecutionContext) {
    const gqlContext = GqlExecutionContext.create(context);

    return gqlContext.getContext<GraphqlContext>().req;
  }

  override handleRequest<TUser = AuthenticatedUser>(
    error: unknown,
    user: TUser | false | null,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (error) {
      throw error;
    }

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    return user;
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
