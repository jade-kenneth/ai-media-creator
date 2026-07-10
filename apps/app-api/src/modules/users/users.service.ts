import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { NotFoundError } from 'src/common/errors/app.error';
import type { RepositoryFilter } from 'src/libs/repository';
import { TOKENS } from 'src/types/tokens';
import {
  UserRole,
  type UpdateMyProfileInput,
  type User,
} from '../../graphql/generated/graphql';
import type {
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
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(TOKENS.USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.findRecord({ id });

    return user ? toUser(user) : null;
  }

  async findManyByIds(ids: string[]): Promise<Map<string, User>> {
    const users = await this.findManyRecordsByIds(ids);

    return new Map(Array.from(users, ([id, user]) => [id, toUser(user)]));
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.findRecord({ email: normalizeEmail(email) });

    return user ? toUser(user) : null;
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
    const user = await this.usersRepository.create({
      id: new Types.ObjectId().toHexString(),
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      role: input.role,
      isActive: input.isActive,
      organizationId: input.organizationId ?? null,
      firstName: normalizeOptionalText(input.firstName),
      lastName: normalizeOptionalText(input.lastName),
      position: normalizeOptionalText(input.position),
      createdAt: now,
      updatedAt: now,
    });

    return toUser(user);
  }

  async updateMyProfile(
    id: string,
    input: UpdateMyProfileInput,
  ): Promise<User> {
    const patch: Partial<UserRecord> = {};

    if (input.firstName !== undefined) {
      patch.firstName = normalizeOptionalText(input.firstName);
    }

    if (input.lastName !== undefined) {
      patch.lastName = normalizeOptionalText(input.lastName);
    }

    if (input.position !== undefined) {
      patch.position = normalizeOptionalText(input.position);
    }

    const updatedUser = await this.updateRecordById(id, patch);

    if (!updatedUser) {
      throw new NotFoundError('User not found.');
    }

    return toUser(updatedUser);
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
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(
      password,
      ADMIN_PASSWORD_SALT_ROUNDS,
    );

    return this.createUser({
      email,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      organizationId,
      firstName: profile?.firstName ?? 'Organization',
      lastName: profile?.lastName ?? 'Admin',
      position: profile?.position ?? 'Organization Admin',
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

  async findAdminEmailsByOrganizationId(
    organizationId: string,
  ): Promise<string[]> {
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

function normalizeOptionalText(value?: string | null): string | null {
  return value?.trim() || null;
}

function toUser(user: UserRecord): User {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId ?? null,
    isActive: user.isActive,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    position: user.position ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
