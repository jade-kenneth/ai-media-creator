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
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { LoaderFactory } from 'src/common/batch/loader-registry';
import type {
  Connection,
  RepositoryFilter,
  RepositorySort,
} from 'src/libs/repository';
import type {
  Announcement,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '../../graphql/generated/graphql';
import { UserRole } from '../../graphql/generated/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type {
  AuthenticatedUser,
  GraphqlContext,
} from '../auth/types/auth-context';
import { AnnouncementsService } from './announcements.service';

@Resolver('Announcement')
export class AnnouncementsResolver {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly loaderFactory: LoaderFactory,
  ) {}

  @Mutation('createAnnouncement')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createAnnouncement(
    @ServiceValidatedArgs('input') input: CreateAnnouncementInput,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<Announcement> {
    return this.announcementsService.createAnnouncement(
      input,
      user.id,
      tenantId,
    );
  }

  @Query('announcements')
  async getAnnouncements(
    @Args('filter') filter?: RepositoryFilter<Announcement>,
    @Args('sort') sort?: RepositorySort<Announcement>,
    @Args('first') first?: number,
    @Args('after') after?: string,
    @CurrentTenant() tenantId?: string,
  ): Promise<Connection<Announcement>> {
    return this.announcementsService.getAnnouncements(
      filter,
      sort,
      first,
      after,
      tenantId,
    );
  }

  @Query('announcement')
  async announcement(@Args('id') id: string): Promise<Announcement | null> {
    return this.announcementsService.getAnnouncement(id);
  }

  @Query('adminAnnouncements')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminAnnouncements(
    @Args('filter') filter?: RepositoryFilter<Announcement>,
    @Args('sort') sort?: RepositorySort<Announcement>,
    @Args('first') first?: number,
    @Args('after') after?: string,
    @CurrentTenant() tenantId?: string,
  ): Promise<Connection<Announcement>> {
    return this.announcementsService.getAdminAnnouncements(
      filter,
      sort,
      first,
      after,
      tenantId,
    );
  }

  @Query('searchByAdminAnnouncements')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async searchByAdminAnnouncements(
    @Args('search') search: string,
    @Args('first') first?: number,
    @Args('after') after?: string,
    @CurrentTenant() tenantId?: string,
  ): Promise<Array<Announcement>> {
    return this.announcementsService.searchByAdminAnnouncements(
      search,
      first,
      after,
      tenantId,
    );
  }

  @Mutation('updateAnnouncement')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateAnnouncement(
    @Args('id') id: string,
    @ServiceValidatedArgs('input') input: UpdateAnnouncementInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Announcement> {
    return this.announcementsService.updateAnnouncement(id, input, user.id);
  }

  @Mutation('deleteAnnouncement')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteAnnouncement(
    @Args('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<boolean> {
    return this.announcementsService.deleteAnnouncement(id, user.id);
  }

  @Mutation('publishAnnouncement')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async publishAnnouncement(
    @Args('id') id: string,
    @Args('isPublished') isPublished: boolean,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<Announcement> {
    return this.announcementsService.publishAnnouncement(
      id,
      isPublished,
      user.id,
      tenantId,
    );
  }

  @Mutation('pinAnnouncement')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async pinAnnouncement(
    @Args('id') id: string,
    @Args('isPinned') isPinned: boolean,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Announcement> {
    return this.announcementsService.pinAnnouncement(id, isPinned, user.id);
  }

  @ResolveField('createdBy')
  async createdBy(
    @Parent() announcement: Announcement,
    @Context() context: GraphqlContext,
  ): Promise<string> {
    const user = await this.loaderFactory
      .forRequest(context.req)
      .memberByUserId.load(announcement.createdBy);

    return user?.fullName ?? announcement.createdBy;
  }

  @ResolveField('updatedBy')
  async updatedBy(
    @Parent() announcement: Announcement,
    @Context() context: GraphqlContext,
  ): Promise<string | null> {
    if (!announcement.updatedBy) {
      return null;
    }

    const user = await this.loaderFactory
      .forRequest(context.req)
      .memberByUserId.load(announcement.updatedBy);

    return user?.fullName ?? announcement.updatedBy;
  }
}
