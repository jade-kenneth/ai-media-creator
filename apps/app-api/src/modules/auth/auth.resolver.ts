import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type {
  AuthPayload,
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
import { GraphqlAuthGuard } from './guards/graphql-auth.guard';
import type { AuthenticatedUser } from './types/auth-context';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation('registerUser')
  @Public()
  async registerUser(
    @ServiceValidatedArgs('input') input: RegisterUserInput,
  ): Promise<AuthPayload> {
    return this.authService.registerUser(input);
  }

  @Mutation('login')
  @Public()
  async login(
    @ServiceValidatedArgs('input') input: LoginInput,
  ): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Mutation('requestPasswordReset')
  @Public()
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
