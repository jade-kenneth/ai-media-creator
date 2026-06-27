import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  DuplicateSessionError,
  SessionTimeoutError,
} from 'src/common/errors/app.error';
import { SessionsService } from 'src/modules/sessions/sessions.service';
import { UserRole } from 'src/graphql/generated/graphql';
import { UsersService } from '../../users/users.service';
import { toAuthenticatedUser } from '../auth-user.mapper';
import { assertMemberCanAuthenticate } from '../registration-approval';
import type { AuthenticatedUser, JwtPayload } from '../types/auth-context';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not configured.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findRecordById(payload.sub);
    const sessionValid = await this.sessionsService.findByJti(payload.jti);

    if (!user) {
      throw new SessionTimeoutError();
    }

    assertMemberCanAuthenticate(user);

    if (user.role !== UserRole.MEMBER && !user.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }

    if (!sessionValid) {
      throw new DuplicateSessionError();
    }

    return toAuthenticatedUser(user, payload.jti);
  }
}
