import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { LoaderFactory } from 'src/common/batch/loader-registry';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import type {
  Connection,
  RepositoryFilter,
  RepositorySort,
} from 'src/libs/repository';
import {
  UserRole,
  type RegistrationRejectionReason,
  type RegistrationStatus,
  type MemberProfile,
  type UpdateMemberProfileInput,
  type User,
} from '../../graphql/generated/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type {
  AuthenticatedUser,
  GraphqlContext,
} from '../auth/types/auth-context';
import { MemberProfileRecord } from './repositories/members.repository';
import { MembersService } from './members.service';

type AdminMemberFilter = RepositoryFilter<
  MemberProfileRecord & {
    isActive: boolean;
    registrationStatus: RegistrationStatus;
  }
>;

@Resolver('MemberProfile')
export class MembersResolver {
  constructor(
    private readonly membersService: MembersService,
    private readonly loaderFactory: LoaderFactory,
  ) {}

  @Query('myProfile')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async myProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MemberProfile> {
    return this.membersService.myProfile(user.id);
  }

  @Query('adminMembers')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminMembers(
    @Args('filter') filter?: AdminMemberFilter,
    @Args('sort') sort?: RepositorySort<MemberProfileRecord>,
    @Args('first') first?: number,
    @Args('after') after?: string,
    @CurrentTenant() tenantId?: string,
  ): Promise<Connection<MemberProfile>> {
    return this.membersService.adminMembers(
      filter,
      sort,
      first,
      after,
      tenantId,
    );
  }

  @Query('adminMember')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminMember(@Args('id') id: string): Promise<MemberProfile | null> {
    return this.membersService.adminMember(id);
  }

  @Query('searchByMembers')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async searchByMembers(
    @Args('search') search: string,
    @Args('first') first?: number,
    @Args('after') after?: string,
  ): Promise<Array<string>> {
    return this.membersService.searchByMembers(search, first, after);
  }

  @Mutation('updateMyProfile')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async updateMyProfile(
    @Args('input') input: UpdateMemberProfileInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MemberProfile> {
    return this.membersService.updateMyProfile(user.id, input);
  }

  @Mutation('approveMember')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveMember(
    @Args('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<User> {
    return this.membersService.approveMember(userId, user.id);
  }

  @Mutation('rejectMember')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async rejectMember(
    @Args('userId') userId: string,
    @Args('rejectionReason') rejectionReason: RegistrationRejectionReason,
    @CurrentUser() user: AuthenticatedUser,
    @Args('rejectionNote') rejectionNote?: string | null,
  ): Promise<User> {
    return this.membersService.rejectMember(
      {
        userId,
        rejectionReason,
        rejectionNote,
      },
      user.id,
    );
  }

  @Mutation('retriggerApprovalNotification')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async retriggerApprovalNotification(
    @Args('userId') userId: string,
  ): Promise<boolean> {
    return this.membersService.retriggerApprovalNotification(userId);
  }

  @ResolveField('user')
  async user(
    @Parent() member: MemberProfile,
    @Context() context: GraphqlContext,
  ): Promise<User | null> {
    return this.loaderFactory
      .forRequest(context.req)
      .userById.load(member.userId);
  }
}
