import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { RepositoryFilter } from 'src/libs/repository';
import { TOKENS } from 'src/types/tokens';
import type { User } from '../../graphql/generated/graphql';
import { RegistrationStatus, UserRole } from '../../graphql/generated/graphql';
import type {
  RegistrationReviewRecord,
  UserRecord,
  UsersRepository,
} from './repositories/users.repository';

const ADMIN_PASSWORD_SALT_ROUNDS = 10;

interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  organizationId?: string | null;
  registrationStatus?: RegistrationStatus;
  registrationReview?: RegistrationReviewRecord | null;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
}

type MemberUserFilter = {
  isActive: boolean;
  registrationStatus: RegistrationStatus;
  organizationId?: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    @Inject(TOKENS.USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.findRecord({ id });

    if (!user) {
      return null;
    }

    return toUser(user);
  }

  async findManyByIds(ids: string[]): Promise<Map<string, User>> {
    const users = await this.findManyRecordsByIds(ids);

    return new Map(Array.from(users, ([id, user]) => [id, toUser(user)]));
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.findRecord({ email: normalizeEmail(email) });

    if (!user) {
      return null;
    }

    return toUser(user);
  }

  async findRecordById(id: string): Promise<UserRecord | null> {
    return this.findRecord({ id });
  }

  async findManyRecordsByIds(ids: string[]): Promise<Map<string, UserRecord>> {
    const uniqueIds = Array.from(new Set(ids));

    if (uniqueIds.length === 0) {
      return new Map();
    }

    const users = await this.usersRepository
      .list({
        id: {
          in: uniqueIds,
        },
      })
      .collect();

    return new Map(users.map((user) => [user.id, user]));
  }

  async findRecordByEmail(email: string): Promise<UserRecord | null> {
    return this.findRecord({ email: normalizeEmail(email) });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.usersRepository.exists({ email: normalizeEmail(email) });
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const now = new Date();

    const registrationStatus =
      input.registrationStatus ??
      (input.role === UserRole.MEMBER
        ? RegistrationStatus.pending_approval
        : RegistrationStatus.approved);

    const user = await this.usersRepository.create({
      id: new Types.ObjectId().toHexString(),
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      role: input.role,
      isActive: input.isActive,
      organizationId: input.organizationId ?? null,
      registrationStatus,
      registrationReview: input.registrationReview ?? null,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      position: input.position ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return toUser(user);
  }

  async findActiveMemberUserIds(
    organizationId?: string | null,
  ): Promise<string[]> {
    return this.findMemberUserIds({
      isActive: { equal: true },
      registrationStatus: { equal: RegistrationStatus.approved },
      ...(organizationId ? { organizationId } : {}),
    });
  }

  async findMemberUserIds(
    filter?: RepositoryFilter<MemberUserFilter>,
  ): Promise<string[]> {
    const memberUsers = await this.usersRepository
      .list({
        ...filter,
        role: {
          equal: UserRole.MEMBER,
        },
      })
      .collect();

    return memberUsers.map((user) => user.id);
  }

  async findMemberUserIdsByActivityFilter(
    filter?: MemberUserFilter,
  ): Promise<string[]> {
    return this.findMemberUserIds(filter);
  }

  async updateRecordById(
    id: string,
    data: Partial<UserRecord>,
  ): Promise<UserRecord | null> {
    const existingUser = await this.findRecord({ id });

    if (!existingUser) {
      return null;
    }

    await this.usersRepository.update(
      { id },
      {
        ...data,
        updatedAt: new Date(),
      },
    );

    return this.usersRepository.find({ id });
  }

  async createAdminUser(
    email: string,
    password: string,
    organizationId: string | null,
    profile?: {
      firstName: string;
      lastName: string;
      position: string;
    },
    reviewedBy?: string,
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(
      password,
      ADMIN_PASSWORD_SALT_ROUNDS,
    );
    const now = new Date();

    return this.createUser({
      email,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      organizationId,
      registrationStatus: RegistrationStatus.approved,
      registrationReview: reviewedBy
        ? {
            reviewedBy,
            reviewedAt: now,
            rejectionReason: null,
            rejectionNote: null,
          }
        : null,
      firstName: profile?.firstName?.trim() || 'Organization',
      lastName: profile?.lastName?.trim() || 'Admin',
      position: profile?.position?.trim() || 'Organization Admin',
    });
  }

  async findAdminRecords(): Promise<UserRecord[]> {
    return this.usersRepository
      .list(
        {
          role: {
            equal: UserRole.ADMIN,
          },
        },
        { sort: { createdAt: 'DESC', id: 'DESC' } },
      )
      .collect();
  }

  async countAdminAccounts(isActive?: boolean): Promise<number> {
    return this.usersRepository.count({
      role: {
        equal: UserRole.ADMIN,
      },
      ...(typeof isActive === 'boolean'
        ? {
            isActive: {
              equal: isActive,
            },
          }
        : {}),
    });
  }

  async findAdminEmailsByOrganizationId(organizationId: string): Promise<string[]> {
    const admins = await this.usersRepository
      .list({
        role: { equal: UserRole.ADMIN },
        organizationId: { equal: organizationId },
        isActive: { equal: true },
      })
      .collect();

    return admins.map((admin) => admin.email);
  }

  async deleteById(id: string): Promise<void> {
    await this.usersRepository.delete({ id });
  }

  private async findRecord(
    filter: RepositoryFilter<UserRecord>,
  ): Promise<UserRecord | null> {
    const exists = await this.usersRepository.exists(filter);

    if (!exists) {
      return null;
    }

    return this.usersRepository.find(filter);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toUser(user: UserRecord): User {
  const { passwordHash, memberProfile, ...userData } = user;
  void passwordHash;
  void memberProfile;
  const registrationStatus =
    user.registrationStatus ??
    (user.isActive
      ? RegistrationStatus.approved
      : RegistrationStatus.pending_approval);

  return {
    ...userData,
    position:
      user.role === UserRole.MEMBER
        ? 'Member'
        : user.role === UserRole.SUPER_ADMIN
          ? 'Super Admin'
          : user.position?.trim() || 'Admin',
    registrationStatus,
    registrationReview: user.registrationReview
      ? {
          ...user.registrationReview,
          reviewedByUser: null,
        }
      : null,
    memberProfile: null,
  };
}
