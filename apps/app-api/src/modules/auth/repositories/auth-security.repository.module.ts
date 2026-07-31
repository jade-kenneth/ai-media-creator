import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { AuthSecurityRepositoryFactory } from './auth-security.repository';

@Module({
  providers: [
    {
      provide: TOKENS.AUTH_SECURITY_REPOSITORY,
      useFactory: AuthSecurityRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.AUTH_SECURITY_REPOSITORY],
})
export class AuthSecurityRepositoryModule {}
