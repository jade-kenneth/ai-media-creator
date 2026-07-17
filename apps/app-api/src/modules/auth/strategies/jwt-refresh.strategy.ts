import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionsService } from 'src/modules/sessions/sessions.service';
import { UsersService } from 'src/modules/users/users.service';
import { toAuthenticatedUser } from '../auth-user.mapper';
import {
  JwtPayload,
  TokenType,
  type AuthenticatedUser,
} from '../types/auth-context';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
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
    if (payload.type !== TokenType.REFRESH) {
      throw new UnauthorizedException('Invalid token type.');
    }

    const session = await this.sessionsService.findByJti(payload.jti);
    const user = await this.usersService.findRecordById(payload.sub);

    if (!session || !user) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }

    return toAuthenticatedUser(user, payload.jti);
  }
}
