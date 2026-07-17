import {
  Controller,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtRefreshGuard } from '../auth/guards/jwt-refresh.guard';
import { type AuthenticatedUser } from '../auth/types/auth-context';
import { SessionsService } from '../sessions/sessions.service';

@Controller('session')
export class SessionsController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
  ) {}

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refreshSession(@CurrentUser() currentUser: AuthenticatedUser) {
    const session = await this.sessionsService.refreshSession(currentUser.jti);

    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }

    const user = await this.authService.me(currentUser);
    return this.authService.buildAuthPayloadForUser(user, currentUser.jti);
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutSession(@CurrentUser() currentUser: AuthenticatedUser) {
    await this.sessionsService.deleteSessionByJti(currentUser.jti);
  }

  @Post('authenticate/google')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  authenticateWithGoogle() {
    throw new NotImplementedException(
      'Google authentication is not implemented.',
    );
  }
}
