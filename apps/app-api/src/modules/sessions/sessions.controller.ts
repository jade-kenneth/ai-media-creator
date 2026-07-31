import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/validation/zod-validation.pipe';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { GoogleAuthService } from '../auth/google-auth.service';
import { JwtRefreshGuard } from '../auth/guards/jwt-refresh.guard';
import { type AuthenticatedUser } from '../auth/types/auth-context';
import { SessionsService } from '../sessions/sessions.service';
import { TurnstileProtected } from '../turnstile/turnstile.decorator';
import { TurnstileGuard } from '../turnstile/turnstile.guard';
import {
  googleAuthBodySchema,
  type GoogleAuthBody,
} from './sessions.validation';

@Controller('session')
export class SessionsController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
    private readonly googleAuthService: GoogleAuthService,
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
  @Public()
  @UseGuards(TurnstileGuard)
  @TurnstileProtected('login')
  @HttpCode(HttpStatus.OK)
  async authenticateWithGoogle(
    @Body(new ZodValidationPipe(googleAuthBodySchema)) body: GoogleAuthBody,
  ) {
    return this.googleAuthService.loginWithGoogle(body.idToken);
  }
}
