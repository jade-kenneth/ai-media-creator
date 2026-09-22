import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { NotFoundError } from 'src/common/errors/app.error';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
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

  async findById(
    id: string,
    organizationId?: string | null,
  ): Promise<User | null> {
    const user = await this.findRecord(
      applyTenantFilter({ id }, organizationId),
    );

    return user ? toUser(user) : null;
  }

  async findManyByIds(
    ids: string[],
    organizationId?: string | null,
  ): Promise<Map<string, User>> {
    const users = await this.findManyRecordsByIds(ids, organizationId);

    return new Map(Array.from(users, ([id, user]) => [id, toUser(user)]));
  }

  /**
   * Unscoped by design: login resolves an account from an email before any
   * tenant context exists — the tenant is derived from the account this
   * returns. Email is globally unique, so this cannot cross tenants ambiguously.
   * Callers that already hold tenant context must use `findById` instead.
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.findRecord({ email: normalizeEmail(email) });

    return user ? toUser(user) : null;
  }

  async findRecordById(
    id: string,
    organizationId?: string | null,
  ): Promise<UserRecord | null> {
    return this.findRecord(applyTenantFilter({ id }, organizationId));
  }

  async findManyRecordsByIds(
    ids: string[],
    organizationId?: string | null,
  ): Promise<Map<string, UserRecord>> {
    const uniqueIds = Array.from(new Set(ids));

    if (uniqueIds.length === 0) {
      return new Map();
    }

    const users = await this.usersRepository
      .list(
        applyTenantFilter(
          {
            id: {
              in: uniqueIds,
            },
          },
          organizationId,
        ),
      )
      .collect();

    return new Map(users.map((user) => [user.id, user]));
  }

  /** Unscoped by design — see `findByEmail`. */
  async findRecordByEmail(email: string): Promise<UserRecord | null> {
    return this.findRecord({ email: normalizeEmail(email) });
  }

  /** Unscoped by design: Google sign-in resolves an account before tenant context exists. */
  async findRecordByGoogleSub(googleSub: string): Promise<UserRecord | null> {
    return this.findRecord({ googleSub });
  }

  /**
   * Claims a Google subject for an account, but only while that account has no
   * link yet. Returns false when another link already exists so the caller can
   * report a conflict instead of silently rebinding the account.
   */
  async linkGoogleSub(id: string, googleSub: string): Promise<boolean> {
    return this.usersRepository.updateOne(
      { id, googleSub: null },
      { googleSub, updatedAt: new Date() },
    );
  }

  async unlinkGoogleSub(id: string): Promise<boolean> {
    return this.usersRepository.updateOne(
      { id },
      { googleSub: null, updatedAt: new Date() },
    );
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
    organizationId?: string | null,
  ): Promise<UserRecord | null> {
    const scoped = applyTenantFilter({ id }, organizationId);
    const existingUser = await this.findRecord(scoped);

    if (!existingUser) {
      return null;
    }

    await this.usersRepository.update(scoped, {
      ...data,
      updatedAt: new Date(),
    });

    return this.usersRepository.find(scoped);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const updated = await this.updateRecordById(id, { passwordHash });

    if (!updated) {
      throw new NotFoundError('User not found.');
    }
  }

  async updatePasswordHashIfCurrent(
    id: string,
    currentPasswordHash: string,
    passwordHash: string,
  ): Promise<boolean> {
    return this.usersRepository.updateOne(
      { id, passwordHash: currentPasswordHash },
      { passwordHash, updatedAt: new Date() },
    );
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

  async findAdminRecords(
    organizationId?: string | null,
  ): Promise<UserRecord[]> {
    return this.usersRepository
      .list(
        applyTenantFilter(
          {
            role: {
              equal: UserRole.ADMIN,
            },
          },
          organizationId,
        ),
        { sort: { createdAt: 'DESC', id: 'DESC' } },
      )
      .collect();
  }

  async countAdminAccounts(
    isActive?: boolean,
    organizationId?: string | null,
  ): Promise<number> {
    return this.usersRepository.count(
      applyTenantFilter(
        {
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
        },
        organizationId,
      ),
    );
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

  async deleteById(id: string, organizationId?: string | null): Promise<void> {
    await this.usersRepository.delete(
      applyTenantFilter({ id }, organizationId),
    );
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

export function normalizeEmail(email: string): string {
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
    googleLinked: Boolean(user.googleSub),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
