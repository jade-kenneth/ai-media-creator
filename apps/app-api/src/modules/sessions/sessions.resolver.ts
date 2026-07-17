import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { type AuthenticatedUser } from '../auth/types/auth-context';
import { SessionsService, ValidateSessionResult } from './sessions.service';

@Resolver()
export class SessionsResolver {
  constructor(private readonly sessionsService: SessionsService) {}

  @Query('validateSession')
  @UseGuards(GraphqlAuthGuard)
  validateSession(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ValidateSessionResult> {
    return this.sessionsService.validateSession(user.jti);
  }
}
