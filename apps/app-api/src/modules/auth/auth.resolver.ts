import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import type {
  AuthPayload,
  LoginInput,
  RegisterMemberInput,
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

  @Mutation('registerMember')
  @Public()
  async registerMember(
    @Args('input') input: RegisterMemberInput,
  ): Promise<AuthPayload> {
    return this.authService.registerMember(input);
  }

  @Mutation('login')
  @Public()
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input);
  }

  @Mutation('logout')
  @UseGuards(GraphqlAuthGuard)
  logout(): boolean {
    return this.authService.logout();
  }

  @Query('me')
  @UseGuards(GraphqlAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.authService.me(user);
  }
}
