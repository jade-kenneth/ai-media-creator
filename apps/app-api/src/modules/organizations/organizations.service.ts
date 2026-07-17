import { Inject, Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ConflictError, NotFoundError } from 'src/common/errors/app.error';
import type { RepositoryFilter } from 'src/libs/repository';
import { TOKENS } from 'src/types/tokens';
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../../graphql/generated/graphql';
import { UsersService } from '../users/users.service';
import type {
  OrganizationRecord,
  OrganizationsRepository,
} from './repositories/organizations.repository';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @Inject(TOKENS.ORGANIZATION_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly usersService: UsersService,
  ) {}

  async findAll(
    filter?: RepositoryFilter<OrganizationRecord>,
  ): Promise<Organization[]> {
    return this.organizationsRepository
      .list(filter, { sort: { createdAt: 'ASC', id: 'ASC' } })
      .collect();
  }

  async count(filter?: RepositoryFilter<OrganizationRecord>): Promise<number> {
    return this.organizationsRepository.count(filter);
  }

  async findLatest(limit = 5): Promise<Organization[]> {
    const organizations = await this.organizationsRepository
      .list({}, { sort: { createdAt: 'DESC', id: 'DESC' } })
      .collect();

    return organizations.slice(0, limit);
  }

  async findById(id: string): Promise<Organization> {
    const exists = await this.organizationsRepository.exists({ id });

    if (!exists) {
      throw new NotFoundError('Organization not found.');
    }

    return this.organizationsRepository.find({ id });
  }

  async findByIdOrNull(id: string): Promise<Organization | null> {
    const exists = await this.organizationsRepository.exists({ id });

    if (!exists) {
      return null;
    }

    return this.organizationsRepository.find({ id });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const exists = await this.organizationsRepository.exists({ slug });

    if (!exists) {
      return null;
    }

    return this.organizationsRepository.find({ slug });
  }

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const slug = input.slug.trim().toLowerCase();
    const slugExists = await this.organizationsRepository.exists({ slug });
    const adminEmail = input.adminEmail.trim().toLowerCase();

    if (slugExists) {
      throw new ConflictError('An organization with this slug already exists.');
    }

    if (await this.usersService.existsByEmail(adminEmail)) {
      throw new ConflictError('Email already exists.');
    }

    const now = new Date();

    const organization = await this.organizationsRepository.create({
      id: new Types.ObjectId().toHexString(),
      name: input.name.trim(),
      slug,
      logoUrl: input.logoUrl ?? null,
      primaryColor: input.primaryColor ?? null,
      contactNumber: input.contactNumber ?? null,
      address: input.address ?? null,
      features: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    try {
      await this.usersService.createAdminUser(
        adminEmail,
        input.adminPassword,
        organization.id,
        {
          firstName: 'Organization',
          lastName: 'Admin',
          position: 'Organization Admin',
        },
      );
    } catch (error) {
      await this.rollbackCreatedOrganization(organization.id);
      throw mapDuplicateAdminEmailError(error);
    }

    return organization;
  }

  async update(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization> {
    await this.findById(id);

    const updateData: Partial<OrganizationRecord> = { updatedAt: new Date() };

    if (input.name != null) updateData.name = input.name.trim();
    if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
    if (input.primaryColor !== undefined)
      updateData.primaryColor = input.primaryColor;
    if (input.contactNumber !== undefined)
      updateData.contactNumber = input.contactNumber;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.features != null) updateData.features = input.features;
    if (input.isActive != null) updateData.isActive = input.isActive;

    await this.organizationsRepository.update({ id }, updateData);

    return this.organizationsRepository.find({ id });
  }

  async deactivate(id: string): Promise<Organization> {
    await this.findById(id);

    await this.organizationsRepository.update(
      { id },
      { isActive: false, updatedAt: new Date() },
    );

    return this.organizationsRepository.find({ id });
  }

  async reactivate(id: string): Promise<Organization> {
    await this.findById(id);

    await this.organizationsRepository.update(
      { id },
      { isActive: true, updatedAt: new Date() },
    );

    return this.organizationsRepository.find({ id });
  }

  private async rollbackCreatedOrganization(
    organizationId: string,
  ): Promise<void> {
    try {
      await this.organizationsRepository.delete({ id: organizationId });
      return;
    } catch (rollbackError) {
      this.logger.error(
        `Failed to delete organization ${organizationId} during rollback.`,
        rollbackError instanceof Error ? rollbackError.stack : undefined,
      );
    }

    try {
      await this.organizationsRepository.update(
        { id: organizationId },
        { isActive: false, updatedAt: new Date() },
      );
    } catch (deactivationError) {
      this.logger.error(
        `Failed to deactivate organization ${organizationId} after rollback delete failure.`,
        deactivationError instanceof Error
          ? deactivationError.stack
          : undefined,
      );
    }
  }
}

function mapDuplicateAdminEmailError(error: unknown): unknown {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  ) {
    return new ConflictError('Email already exists.');
  }

  return error;
}
