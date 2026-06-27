import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConflictError, NotFoundError } from 'src/common/errors/app.error';
import type {
  AdminAccount,
  CreateAdminAccountInput,
  UpdateAdminAccountInput,
} from '../../graphql/generated/graphql';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import type { UserRecord as StoredUserRecord } from '../users/repositories/users.repository';

const ADMIN_PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class AdminManagementService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async createAdminAccount(
    input: CreateAdminAccountInput,
    superAdminId: string,
  ): Promise<AdminAccount> {
    const email = input.email.trim().toLowerCase();

    if (await this.usersService.existsByEmail(email)) {
      throw new ConflictError('Email already exists.');
    }

    const organization = await this.organizationsService.findByIdOrNull(
      input.organizationId,
    );

    if (!organization) {
      throw new NotFoundError('Organization not found.');
    }

    const user = await this.usersService.createAdminUser(
      email,
      input.password,
      input.organizationId,
      {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        position: input.position.trim(),
      },
      superAdminId,
    );

    const record = await this.usersService.findRecordById(user.id);

    if (!record) {
      throw new NotFoundError('Admin account not found.');
    }

    return toAdminAccount(record);
  }

  async findAll(): Promise<AdminAccount[]> {
    const adminRecords = await this.usersService.findAdminRecords();
    return adminRecords.map(toAdminAccount);
  }

  async updateAdminAccount(
    id: string,
    input: UpdateAdminAccountInput,
  ): Promise<AdminAccount> {
    const existingRecord = await this.findAdminRecordByIdOrThrow(id);

    if (input.organizationId != null) {
      const organization = await this.organizationsService.findByIdOrNull(
        input.organizationId,
      );

      if (!organization) {
        throw new NotFoundError('Organization not found.');
      }
    }

    const patch: Partial<StoredUserRecord> = {};

    if (input.firstName != null) patch.firstName = input.firstName.trim();
    if (input.lastName != null) patch.lastName = input.lastName.trim();
    if (input.position != null) patch.position = input.position.trim();
    if (input.organizationId != null) patch.organizationId = input.organizationId;

    if (input.password != null && input.password.trim().length > 0) {
      patch.passwordHash = await bcrypt.hash(
        input.password,
        ADMIN_PASSWORD_SALT_ROUNDS,
      );
    }

    const updatedRecord = await this.usersService.updateRecordById(
      existingRecord.id,
      patch,
    );

    if (!updatedRecord) {
      throw new NotFoundError('Admin account not found.');
    }

    return toAdminAccount(updatedRecord);
  }

  async deactivateAdminAccount(id: string): Promise<AdminAccount> {
    await this.findAdminRecordByIdOrThrow(id);

    const updatedRecord = await this.usersService.updateRecordById(id, {
      isActive: false,
    });

    if (!updatedRecord) {
      throw new NotFoundError('Admin account not found.');
    }

    return toAdminAccount(updatedRecord);
  }

  async reactivateAdminAccount(id: string): Promise<AdminAccount> {
    await this.findAdminRecordByIdOrThrow(id);

    const updatedRecord = await this.usersService.updateRecordById(id, {
      isActive: true,
    });

    if (!updatedRecord) {
      throw new NotFoundError('Admin account not found.');
    }

    return toAdminAccount(updatedRecord);
  }

  private async findAdminRecordByIdOrThrow(
    id: string,
  ): Promise<StoredUserRecord> {
    const record = await this.usersService.findRecordById(id);

    if (!record || record.role !== 'ADMIN') {
      throw new NotFoundError('Admin account not found.');
    }

    return record;
  }
}

function toAdminAccount(record: StoredUserRecord): AdminAccount {
  if (!record.organizationId) {
    throw new NotFoundError('Admin account is missing a organization.');
  }

  return {
    id: record.id,
    email: record.email,
    isActive: record.isActive,
    organizationId: record.organizationId,
    firstName: record.firstName?.trim() || 'Organization',
    lastName: record.lastName?.trim() || 'Admin',
    position: record.position?.trim() || 'Admin',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
