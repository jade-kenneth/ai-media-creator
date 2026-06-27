import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import type {
  Connection,
  RepositoryFilter,
  RepositorySort,
} from 'src/libs/repository';
import {
  UserRole,
  type JoinWaitlistInput,
  type WaitlistEntry,
  type WaitlistStats,
} from '../../graphql/generated/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WaitlistService } from './waitlist.service';
import type { WaitlistEntryRecord } from './repositories/waitlist.repository';

@Resolver('WaitlistEntry')
export class WaitlistResolver {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Mutation('joinWaitlist')
  async joinWaitlist(@Args('input') input: JoinWaitlistInput) {
    return this.waitlistService.join(input);
  }

  @Mutation('deleteWaitlistEntry')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async deleteWaitlistEntry(@Args('id') id: string): Promise<boolean> {
    return this.waitlistService.deleteEntry(id);
  }

  @Query('adminWaitlistEntries')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async adminWaitlistEntries(
    @Args('filter') filter?: RepositoryFilter<WaitlistEntryRecord>,
    @Args('sort') sort?: RepositorySort<WaitlistEntryRecord>,
    @Args('first') first?: number,
    @Args('after') after?: string,
  ): Promise<Connection<WaitlistEntry>> {
    return this.waitlistService.list(filter, sort, first, after);
  }

  @Query('adminWaitlistStats')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async adminWaitlistStats(): Promise<WaitlistStats> {
    return this.waitlistService.stats();
  }
}
