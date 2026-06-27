import { Connection, Types } from 'mongoose';
import { Announcement } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/moongose-repository';
import { Repository } from 'src/libs/repository';

export interface AnnouncementRecord extends Announcement {
  organizationId?: string | null;
}

export type AnnouncementsRepository = Repository<AnnouncementRecord>;

export async function AnnouncementsRepositoryFactory(
  connection: Connection,
): Promise<AnnouncementsRepository> {
  return new MongooseRepository<AnnouncementRecord>(
    connection,
    'Announcements',
    {
      id: Types.ObjectId,
      cursor: String,
      title: String,
      content: String,
      category: String,
      coverImageUrl: String,
      isPinned: Boolean,
      isPublished: Boolean,
      publishedAt: Date,
      createdBy: String,
      updatedBy: String,
      deletedAt: Date,
      organizationId: String,
      createdAt: Date,
      updatedAt: Date,
    },
    [
      [{ organizationId: 1, isPublished: 1, isPinned: -1, publishedAt: -1 }],
      [{ organizationId: 1, category: 1 }],
      [{ organizationId: 1, deletedAt: 1 }],
    ],
  );
}
// THIS FACTORY FUNCTION CREATES AN INSTANCE OF THE ANNOUNCEMENTS REPOSITORY USING THE MONGOOSE CONNECTION. IT DEFINES THE SCHEMA FOR THE ANNOUNCEMENT DOCUMENTS IN THE DATABASE AND RETURNS A REPOSITORY INSTANCE THAT CAN BE USED TO PERFORM CRUD OPERATIONS ON ANNOUNCEMENT DATA.
