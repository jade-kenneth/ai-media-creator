import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { MailModule } from '../mail/mail.module';
import { CreditsModule } from '../credits/credits.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { SessionsController } from '../sessions/sessions.controller';
import { SessionsModule } from '../sessions/sessions.module';
import { TurnstileModule } from '../turnstile/turnstile.module';
import { UsersModule } from '../users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { GoogleIdentityService } from './google-identity.service';
import { GraphqlAuthGuard } from './guards/graphql-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthSecurityRepositoryModule } from './repositories/auth-security.repository.module';

import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRATION');

        if (!secret) {
          throw new Error('JWT_SECRET is not configured.');
        }

        if (!expiresIn) {
          throw new Error('JWT_EXPIRATION is not configured.');
        }

        return {
          secret,
          signOptions: {
            expiresIn: parseJwtExpiration(expiresIn),
          },
        };
      },
    }),
    AuthSecurityRepositoryModule,
    CreditsModule,
    MailModule,
    OrganizationsModule,
    UsersModule,
    SessionsModule,
    TurnstileModule,
  ],

  controllers: [SessionsController],
  providers: [
    AuthService,
    AuthResolver,
    GoogleAuthService,
    GoogleIdentityService,
    JwtStrategy,
    JwtRefreshStrategy,
    GraphqlAuthGuard,
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    GoogleAuthService,
    JwtModule,
    PassportModule,
    GraphqlAuthGuard,
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
  ],
})
export class AuthModule {}

function parseJwtExpiration(value: string): number | StringValue {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  return value as StringValue;
}
