import { UseGuards } from '@nestjs/common';
import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type {
  AuthPayload,
  LoginInput,
  RegisterUserInput,
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
