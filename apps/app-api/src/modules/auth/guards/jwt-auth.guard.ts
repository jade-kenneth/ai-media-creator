import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../types/auth-context';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = AuthenticatedUser>(
    error: unknown,
    user: TUser | false | null,
  ): TUser {
    if (error) {
      throw error;
    }

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    return user;
  }
}
