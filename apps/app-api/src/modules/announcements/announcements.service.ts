import { Inject, Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotFoundError } from 'src/common/errors/app.error';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import { generateCursor } from 'src/libs/cursor';
import {
  Connection,
  RepositoryFilter,
  type RepositorySort,
} from 'src/libs/repository';
import { TOKENS } from 'src/types/tokens';
import {
  type Announcement,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
} from '../../graphql/generated/graphql';
import { NotificationsService } from '../notifications/notifications.service';
import type { AnnouncementsRepository } from './repositories/announcements.repository';

const ANNOUNCEMENTS_SEARCH_INDEX = 'announcements_search'; // THIS IS THE NAME OF THE SEARCH INDEX DEFINED IN MONGODB ATLAS FOR ANNOUNCEMENTS

const PUBLIC_ANNOUNCEMENTS_SORT: RepositorySort<Announcement> = {
  isPinned: 'DESC',
  publishedAt: 'DESC',
  createdAt: 'DESC',
  id: 'DESC',
};

const DASHBOARD_LATEST_ANNOUNCEMENTS_SORT: RepositorySort<Announcement> = {
  publishedAt: 'DESC',
  createdAt: 'DESC',
  id: 'DESC',
};
const DEFAULT_LATEST_ANNOUNCEMENTS_LIMIT = 5;

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @Inject(TOKENS.ANNOUNCEMENTS_REPOSITORY) // INJECTING THE REPOSITORY
    private readonly announcements: AnnouncementsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  public async createAnnouncement(
    input: CreateAnnouncementInput,
    createdBy: string,
    organizationId: string,
  ): Promise<Announcement> {
    const now = new Date();

    const announcement: Announcement = {
      cursor: generateCursor(),
      id: new Types.ObjectId().toHexString(),
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category,
      coverImageUrl: input.coverImageUrl,
      isPinned: input.isPinned ?? false,
      isPublished: input.isPublished ?? false,
      publishedAt: input.isPublished ? now : null,
      createdBy,
      updatedBy: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      organizationId,
    } as Announcement;

    const createdAnnouncement = await this.announcements.create(announcement);

    await this.notifyIfNewlyPublished(null, createdAnnouncement, organizationId);

    return createdAnnouncement;
  }

  public async getAnnouncements(
    filter?: RepositoryFilter<Announcement>,
    sort?: RepositorySort<Announcement>,
    first?: number,
    after?: string,
    organizationId?: string | null,
  ): Promise<Connection<Announcement>> {
    return this.announcements
      .list(applyTenantFilter(filter, organizationId), {
        sort: sort ?? PUBLIC_ANNOUNCEMENTS_SORT,
      })
      .connection({ first, after });
  }

  public async getAnnouncement(id: string): Promise<Announcement | null> {
    return this.findOne({
      id,
      isPublished: true,
      deletedAt: null,
    });
  }

  public async getAdminAnnouncements(
    filter?: RepositoryFilter<Announcement>,
    sort?: RepositorySort<Announcement>,
    first?: number,
    after?: string,
    organizationId?: string | null,
  ): Promise<Connection<Announcement>> {
    return this.announcements
      .list(applyTenantFilter(filter, organizationId), {
        sort: sort,
      })
      .connection({ first, after });
  }

  public async getLatestPublishedAnnouncements(
    limit = DEFAULT_LATEST_ANNOUNCEMENTS_LIMIT,
    organizationId?: string | null,
  ): Promise<Array<Announcement>> {
    const connection = await this.announcements
      .list(
        applyTenantFilter({ isPublished: true, deletedAt: null }, organizationId),
        { sort: DASHBOARD_LATEST_ANNOUNCEMENTS_SORT },
      )
      .connection({
        first: limit ?? DEFAULT_LATEST_ANNOUNCEMENTS_LIMIT,
      });

    return connection.edges.map((edge) => edge.node);
  }

  public async searchByAdminAnnouncements(
    search: string,
    first?: number,
    after?: string,
    organizationId?: string | null,
  ): Promise<Array<Announcement>> {
    void after;

    const normalizedSearch = search.trim();

    if (!normalizedSearch) {
      return [];
    }

    return this.announcements.search(
      normalizedSearch,
      applyTenantFilter({ deletedAt: null }, organizationId),
      {
        index: ANNOUNCEMENTS_SEARCH_INDEX,
        type: 'autocomplete',
        path: 'title',
        limit: first,
      },
    );
  }

  public async updateAnnouncement(
    id: string,
    input: UpdateAnnouncementInput,
    actorId: string,
  ): Promise<Announcement> {
    const currentAnnouncement = await this.findActiveAnnouncementOrThrow(id);
    const now = new Date();

    const merged: Announcement = {
      ...currentAnnouncement,
      ...input,
      updatedAt: now,
      updatedBy: actorId,
    };

    await this.announcements.update({ id, deletedAt: null }, merged);

    const updatedAnnouncement = await this.announcements.find({ id });

    await this.notifyIfNewlyPublished(currentAnnouncement, updatedAnnouncement);

    return updatedAnnouncement;
  }

  public async deleteAnnouncement(
    id: string,
    actorId: string,
  ): Promise<boolean> {
    const announcement = await this.findOne({ id, deletedAt: null });

    if (!announcement) {
      return false;
    }

    const now = new Date();

    await this.announcements.update(
      { id, deletedAt: null },
      {
        deletedAt: now,
        updatedBy: actorId,
        updatedAt: now,
      },
    );

    return true;
  }

  public async publishAnnouncement(
    id: string,
    isPublished: boolean,
    actorId: string,
    organizationId?: string | null,
  ): Promise<Announcement> {
    const currentAnnouncement = await this.findActiveAnnouncementOrThrow(id);
    const now = new Date();

    await this.announcements.update(
      { id, deletedAt: null },
      {
        isPublished,
        publishedAt: isPublished
          ? (currentAnnouncement.publishedAt ?? now)
          : null,
        updatedBy: actorId,
        updatedAt: now,
      },
    );

    const updatedAnnouncement = await this.announcements.find({ id });

    await this.notifyIfNewlyPublished(
      currentAnnouncement,
      updatedAnnouncement,
      organizationId,
    );

    return updatedAnnouncement;
  }

  public async pinAnnouncement(
    id: string,
    isPinned: boolean,
    actorId: string,
  ): Promise<Announcement> {
    await this.findActiveAnnouncementOrThrow(id);

    await this.announcements.update(
      { id, deletedAt: null },
      {
        isPinned,
        updatedBy: actorId,
        updatedAt: new Date(),
      },
    );

    return this.announcements.find({ id });
  }

  private async findActiveAnnouncementOrThrow(
    id: string,
  ): Promise<Announcement> {
    const announcement = await this.findOne({ id, deletedAt: null });

    if (!announcement) {
      throw new NotFoundError('Announcement not found.');
    }

    return announcement;
  }

  private async findOne(
    filter: RepositoryFilter<Announcement>,
  ): Promise<Announcement | null> {
    const exists = await this.announcements.exists(filter);

    if (!exists) {
      return null;
    }

    return this.announcements.find(filter);
  }

  private async notifyIfNewlyPublished(
    previousAnnouncement: Announcement | null,
    announcement: Announcement,
    organizationId?: string | null,
  ): Promise<void> {
    if (!announcement.isPublished || previousAnnouncement?.isPublished) {
      return;
    }

    try {
      await this.notificationsService.createAnnouncementPublishedNotifications(
        announcement,
        organizationId,
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown notification error.';

      this.logger.error(
        `Announcement ${announcement.id} was published but notifications failed: ${reason}`,
      );
    }
  }
}
