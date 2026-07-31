import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import { TurnstileProtected } from '../turnstile/turnstile.decorator';
import { TurnstileGuard } from '../turnstile/turnstile.guard';
import type {
  AuthPayload,
  GoogleAuthInput,
  LoginInput,
  PasswordResetCodeResult,
  PasswordResetRequestResult,
  RegisterUserInput,
  ResetPasswordInput,
  UpdateMyProfileInput,
  User,
} from '../../graphql/generated/graphql';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { GoogleAuthService } from './google-auth.service';
import { GraphqlAuthGuard } from './guards/graphql-auth.guard';
import type { AuthenticatedUser } from './types/auth-context';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Mutation('registerUser')
  @Public()
  @UseGuards(TurnstileGuard)
  @TurnstileProtected('signup')
  async registerUser(
    @ServiceValidatedArgs('input') input: RegisterUserInput,
  ): Promise<AuthPayload> {
    return this.authService.registerUser(input);
  }

  @Mutation('login')
  @Public()
  @UseGuards(TurnstileGuard)
  @TurnstileProtected('login')
  async login(
    @ServiceValidatedArgs('input') input: LoginInput,
  ): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Mutation('loginWithGoogle')
  @Public()
  @UseGuards(TurnstileGuard)
  @TurnstileProtected('login')
  async loginWithGoogle(
    @ServiceValidatedArgs('input') input: GoogleAuthInput,
  ): Promise<AuthPayload> {
    return this.googleAuthService.loginWithGoogle(input.idToken);
  }

  @Mutation('linkGoogleAccount')
  @UseGuards(GraphqlAuthGuard)
  async linkGoogleAccount(
    @ServiceValidatedArgs('input') input: GoogleAuthInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<User> {
    return this.googleAuthService.linkGoogleAccount(user, input.idToken);
  }

  @Mutation('unlinkGoogleAccount')
  @UseGuards(GraphqlAuthGuard)
  async unlinkGoogleAccount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<User> {
    return this.googleAuthService.unlinkGoogleAccount(user);
  }

  @Mutation('requestPasswordReset')
  @Public()
  @UseGuards(TurnstileGuard)
  @TurnstileProtected('password_reset')
  async requestPasswordReset(
    @Args('email') email: string,
  ): Promise<PasswordResetRequestResult> {
    return this.authService.requestPasswordReset(email);
  }

  @Mutation('verifyResetCode')
  @Public()
  async verifyResetCode(
    @Args('email') email: string,
    @Args('code') code: string,
  ): Promise<PasswordResetCodeResult> {
    return this.authService.verifyResetCode(email, code);
  }

  @Mutation('resetPassword')
  @Public()
  async resetPassword(
    @ServiceValidatedArgs('input') input: ResetPasswordInput,
  ): Promise<boolean> {
    return this.authService.resetPassword(input);
  }

  @Mutation('updateMyProfile')
  @UseGuards(GraphqlAuthGuard)
  async updateMyProfile(
    @ServiceValidatedArgs('input') input: UpdateMyProfileInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<User> {
    return this.authService.updateMyProfile(user, input);
  }

  @Mutation('logout')
  @UseGuards(GraphqlAuthGuard)
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<boolean> {
    return this.authService.logout(user);
  }

  @Query('me')
  @UseGuards(GraphqlAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.authService.me(user);
  }
}
