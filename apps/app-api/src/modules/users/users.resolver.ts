import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { LoaderFactory } from 'src/common/batch/loader-registry';
import type {
  RegistrationReview,
  MemberProfile,
  User,
} from '../../graphql/generated/graphql';
import type { GraphqlContext } from '../auth/types/auth-context';

@Resolver('User')
export class UsersResolver {
  constructor(private readonly loaderFactory: LoaderFactory) {}

  @ResolveField('memberProfile')
  async memberProfile(
    @Parent() user: User,
    @Context() context: GraphqlContext,
  ): Promise<MemberProfile | null> {
    return this.loaderFactory
      .forRequest(context.req)
      .memberByUserId.load(user.id);
  }

  @ResolveField('registrationReview')
  async registrationReview(
    @Parent() user: User,
  ): Promise<RegistrationReview | null> {
    return user.registrationReview ?? null;
  }

  @ResolveField('position')
  position(@Parent() user: User): string {
    if (user.role === 'MEMBER') return 'Member';
    if (user.role === 'SUPER_ADMIN') return 'Super Admin';

    return (user as User & { position?: string | null }).position ?? 'Admin';
  }
}

@Resolver('RegistrationReview')
export class RegistrationReviewResolver {
  constructor(private readonly loaderFactory: LoaderFactory) {}

  @ResolveField('reviewedByUser')
  async reviewedByUser(
    @Parent() registrationReview: RegistrationReview,
    @Context() context: GraphqlContext,
  ): Promise<User | null> {
    if (!registrationReview.reviewedBy) return null;

    return this.loaderFactory
      .forRequest(context.req)
      .userById.load(registrationReview.reviewedBy);
  }
}
