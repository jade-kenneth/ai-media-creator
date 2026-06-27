import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { NotFoundError, ValidationError } from 'src/common/errors/app.error';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import type { Connection, RepositorySort } from 'src/libs/repository';
import { RepositoryFilter } from 'src/libs/repository';
import { TOKENS } from 'src/types/tokens';
import type {
  MemberProfile,
  UpdateMemberProfileInput,
  User,
} from '../../graphql/generated/graphql';
import {
  RegistrationRejectionReason,
  RegistrationStatus,
  UserRole,
} from '../../graphql/generated/graphql';
import { OrganizationsService } from '../organizations/organizations.service';
import type { UserRecord } from '../users/repositories/users.repository';
import { UsersService } from '../users/users.service';
import {
  REGISTRATION_EVENTS,
  RegistrationApprovedEvent,
  RegistrationRejectedEvent,
} from './events/registration.events';
import type {
  MemberProfileRecord,
  MembersRepository,
} from './repositories/members.repository';

const ADMIN_MEMBERS_DEFAULT_SORT: RepositorySort<MemberProfileRecord> = {
  createdAt: 'DESC',
  id: 'DESC',
};
const DEFAULT_SEARCH_LIMIT = 10;
const MEMBERS_SEARCH_INDEX = 'members_search';

type AdminMemberFilter = RepositoryFilter<
  MemberProfileRecord & {
    isActive: boolean;
    registrationStatus: RegistrationStatus;
  }
>;

interface CreateMemberProfileInput {
  userId: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  contactNumber?: string | null;
}

interface RejectMemberInput {
  userId: string;
  rejectionReason: RegistrationRejectionReason;
  rejectionNote?: string | null;
}

@Injectable()
export class MembersService {
  constructor(
    @Inject(TOKENS.MEMBERS_REPOSITORY)
    private readonly membersRepository: MembersRepository,
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findById(id: string): Promise<MemberProfile | null> {
    const member = await this.findOne({ id });

    if (!member) {
      return null;
    }

    return toMemberProfile(member);
  }

  async findByUserId(userId: string): Promise<MemberProfile | null> {
    const member = await this.findOne({ userId });

    if (!member) {
      return null;
    }

    return toMemberProfile(member);
  }

  async findManyByUserIds(
    userIds: string[],
  ): Promise<Map<string, MemberProfile>> {
    const uniqueUserIds = Array.from(new Set(userIds));

    if (uniqueUserIds.length === 0) {
      return new Map();
    }

    const members = await this.membersRepository
      .list({
        userId: {
          in: uniqueUserIds,
        },
      })
      .collect();

    return new Map(
      members.map((member) => [
        member.userId,
        toMemberProfile(member),
      ]),
    );
  }

  async findManyByIds(ids: string[]): Promise<Map<string, MemberProfile>> {
    const uniqueIds = Array.from(new Set(ids));

    if (uniqueIds.length === 0) {
      return new Map();
    }

    const members = await this.membersRepository
      .list({
        id: {
          in: uniqueIds,
        },
      })
      .collect();

    return new Map(
      members.map((member) => [member.id, toMemberProfile(member)]),
    );
  }

  async count(organizationId?: string | null): Promise<number> {
    return this.membersRepository.count(organizationId ? { organizationId } : {});
  }

  async countCreatedBetween(
    from: Date,
    to: Date,
    organizationId?: string | null,
  ): Promise<number> {
    return this.membersRepository.count(
      applyTenantFilter(
        {
          createdAt: {
            greaterThanOrEqual: from,
            lesserThan: to,
          },
        },
        organizationId,
      ),
    );
  }

  async myProfile(userId: string): Promise<MemberProfile> {
    const member = await this.findByUserId(userId);

    if (!member) {
      throw new NotFoundError('Member profile not found.');
    }

    return member;
  }

  async updateMyProfile(
    userId: string,
    input: UpdateMemberProfileInput,
  ): Promise<MemberProfile> {
    const member = await this.myProfile(userId);

    if (!member) {
      throw new NotFoundError('Member profile not found.');
    }

    if (Object.keys(input).length === 0) {
      return member;
    }

    await this.membersRepository.update({ id: member.id }, input);

    const updatedMember = await this.membersRepository.find({
      id: member.id,
    });

    return toMemberProfile(updatedMember);
  }

  async adminMembers(
    filter?: AdminMemberFilter,
    sort?: RepositorySort<MemberProfileRecord>,
    first?: number,
    after?: string,
    organizationId?: string | null,
  ): Promise<Connection<MemberProfile>> {
    const { isActive, registrationStatus, ...memberFilter } = filter ?? {};

    let scopedFilter: RepositoryFilter<MemberProfileRecord> = {
      ...memberFilter,
      ...(organizationId ? { organizationId } : {}),
    };

    if (isActive != null || registrationStatus != null) {
      const memberUserIds = await this.usersService.findMemberUserIds({
        ...(organizationId ? { organizationId } : {}),
        ...(isActive != null ? { isActive } : {}),
        ...(registrationStatus != null ? { registrationStatus } : {}),
      });

      scopedFilter = {
        ...scopedFilter,
        userId: {
          in: memberUserIds,
        },
      };
    }

    const connection = await this.membersRepository
      .list(scopedFilter, {
        sort: sort ?? ADMIN_MEMBERS_DEFAULT_SORT,
      })
      .connection({ first, after });

    return {
      ...connection,
      edges: connection.edges.map((edge) => ({
        ...edge,
        node: toMemberProfile(edge.node),
      })),
    };
  }

  async adminMember(id: string): Promise<MemberProfile | null> {
    return this.findById(id);
  }

  async searchByMembers(
    search: string,
    first?: number,
    after?: string,
  ): Promise<Array<string>> {
    void after;

    const normalizedSearch = search.trim();

    if (!normalizedSearch) {
      return [];
    }

    const members = await this.membersRepository.search(
      normalizedSearch,
      {},
      {
        index: MEMBERS_SEARCH_INDEX,
        type: 'autocomplete',
        path: 'firstName',
        limit: normalizeSearchLimit(first),
      },
    );

    return members.map((member) => member.id);
  }

  async approveMember(userId: string, reviewedBy: string): Promise<User> {
    const existingUser = await this.usersService.findRecordById(userId);

    if (!existingUser) {
      throw new NotFoundError('Member account not found.');
    }

    this.assertMemberAccount(existingUser);
    const organization = existingUser.organizationId
      ? await this.organizationsService.findByIdOrNull(existingUser.organizationId)
      : null;

    const now = new Date();

    await this.usersService.updateRecordById(userId, {
      registrationStatus: RegistrationStatus.approved,
      isActive: true,
      registrationReview: {
        reviewedBy,
        reviewedAt: now,
        rejectionReason: null,
        rejectionNote: null,
      },
    });

    const approvedUser = await this.usersService.findById(userId);

    if (!approvedUser) {
      throw new NotFoundError('Member account not found.');
    }

    this.eventEmitter.emit(
      REGISTRATION_EVENTS.APPROVED,
      new RegistrationApprovedEvent(
        approvedUser.id,
        approvedUser.email,
        extractMemberFirstName(approvedUser, existingUser),
        organization?.name ?? 'your organization',
      ),
    );

    return approvedUser;
  }

  async rejectMember(
    input: RejectMemberInput,
    reviewedBy: string,
  ): Promise<User> {
    const existingUser = await this.usersService.findRecordById(input.userId);

    if (!existingUser) {
      throw new NotFoundError('Member account not found.');
    }

    this.assertMemberAccount(existingUser);

    const rejectionNote = input.rejectionNote?.trim() || null;

    if (
      input.rejectionReason === RegistrationRejectionReason.OTHER &&
      (!rejectionNote || rejectionNote.length === 0)
    ) {
      throw new ValidationError(
        'Rejection note is required when rejection reason is OTHER.',
        {
          field: 'rejectionNote',
        },
      );
    }

    if (
      !Object.values(RegistrationRejectionReason).includes(
        input.rejectionReason,
      )
    ) {
      throw new ValidationError('Invalid rejection reason.');
    }

    const organization = existingUser.organizationId
      ? await this.organizationsService.findByIdOrNull(existingUser.organizationId)
      : null;

    await this.usersService.updateRecordById(input.userId, {
      registrationStatus: RegistrationStatus.rejected,
      isActive: false,
      registrationReview: {
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason: input.rejectionReason,
        rejectionNote,
      },
    });

    const rejectedUser = await this.usersService.findById(input.userId);

    if (!rejectedUser) {
      throw new NotFoundError('Member account not found.');
    }

    this.eventEmitter.emit(
      REGISTRATION_EVENTS.REJECTED,
      new RegistrationRejectedEvent(
        rejectedUser.id,
        rejectedUser.email,
        extractMemberFirstName(rejectedUser, existingUser),
        input.rejectionReason,
        rejectionNote,
        organization?.name ?? null,
      ),
    );

    return rejectedUser;
  }

  async retriggerApprovalNotification(userId: string): Promise<boolean> {
    const existingUser = await this.usersService.findRecordById(userId);

    if (!existingUser) {
      throw new NotFoundError('Member account not found.');
    }

    this.assertMemberAccount(existingUser);

    if (existingUser.registrationStatus !== RegistrationStatus.approved) {
      throw new ValidationError(
        'Only approved members can have their approval notification retriggered.',
      );
    }

    const organization = existingUser.organizationId
      ? await this.organizationsService.findByIdOrNull(existingUser.organizationId)
      : null;

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundError('Member account not found.');
    }

    this.eventEmitter.emit(
      REGISTRATION_EVENTS.APPROVED,
      new RegistrationApprovedEvent(
        user.id,
        user.email,
        extractMemberFirstName(user, existingUser),
        organization?.name ?? 'your organization',
      ),
    );

    return true;
  }

  async findUserByMemberId(id: string): Promise<User | null> {
    const member = await this.findOne({ id });

    if (!member) {
      return null;
    }

    return this.usersService.findById(member.userId);
  }

  async createProfile(
    input: CreateMemberProfileInput,
  ): Promise<MemberProfile> {
    const now = new Date();

    const member = await this.membersRepository.create({
      id: new Types.ObjectId().toHexString(),
      userId: input.userId,
      organizationId: input.organizationId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      middleName: null,
      birthdate: null,
      gender: null,
      address: null,
      purok: null,
      contactNumber: input.contactNumber?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });

    return toMemberProfile(member);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.membersRepository.delete({ userId });
  }

  private async findOne(
    filter: RepositoryFilter<MemberProfileRecord>,
  ): Promise<MemberProfileRecord | null> {
    const exists = await this.membersRepository.exists(filter);

    if (!exists) {
      return null;
    }

    return this.membersRepository.find(filter);
  }

  private assertMemberAccount(user: UserRecord): void {
    if (user.role !== UserRole.MEMBER) {
      throw new ValidationError('Only member accounts can be reviewed.');
    }
  }
}

function extractMemberFirstName(user: User, record: UserRecord): string {
  return record.firstName?.trim() || user.email.split('@')[0] || 'Member';
}

function toMemberProfile(member: MemberProfileRecord): MemberProfile {
  return {
    ...member,
    fullName: buildFullName(member),
    user: null,
  };
}

function buildFullName(member: MemberProfileRecord): string {
  return [member.firstName, member.middleName, member.lastName]
    .filter((value): value is string => Boolean(value))
    .join(' ');
}

function normalizeSearchLimit(first?: number): number {
  if (typeof first !== 'number' || Number.isNaN(first)) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.max(1, Math.trunc(first));
}
