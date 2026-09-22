import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import type {
  Connection,
  RepositoryFilter,
  RepositorySort,
} from 'src/libs/repository';
import { TOKENS } from 'src/types/tokens';
import {
  AccountDeletionRequestStatus,
  type AccountDeletionRequest,
  type ReviewAccountDeletionRequestInput,
  type SubmitAccountDeletionRequestInput,
} from '../../graphql/generated/graphql';
import { AuthService } from '../auth/auth.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import type {
  AccountDeletionRequestRecord,
  AccountDeletionRequestsRepository,
} from './repositories/account-deletion-requests.repository';

const ACCOUNT_DELETION_REQUESTS_SORT = {
  createdAt: 'DESC',
  id: 'DESC',
} as const;

@Injectable()
export class AccountDeletionRequestsService {
  constructor(
    @Inject(TOKENS.ACCOUNT_DELETION_REQUESTS_REPOSITORY)
    private readonly accountDeletionRequestsRepository: AccountDeletionRequestsRepository,
    private readonly authService: AuthService,
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  async submit(
    input: SubmitAccountDeletionRequestInput,
  ): Promise<AccountDeletionRequest> {
    const organization = await this.organizationsService.findById(
      input.organizationId,
    );

    const now = new Date();

    return this.accountDeletionRequestsRepository.create({
      id: new Types.ObjectId().toHexString(),
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      organizationId: input.organizationId,
      organizationName: organization.name,
      status: AccountDeletionRequestStatus.PENDING,
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * `filter` arrives from the caller, so tenant scope is composed on top of it
   * rather than trusted from it. Today every caller is a super-admin carrying no
   * tenant, which passes through unchanged; the composition is what keeps this
   * safe if the operation is ever opened to tenant-scoped roles.
   */
  async list(
    filter?: RepositoryFilter<AccountDeletionRequestRecord>,
    sort?: RepositorySort<AccountDeletionRequestRecord>,
    first?: number,
    after?: string,
    organizationId?: string | null,
  ): Promise<Connection<AccountDeletionRequest>> {
    return this.accountDeletionRequestsRepository
      .list(applyTenantFilter(filter, organizationId), {
        sort: sort ?? ACCOUNT_DELETION_REQUESTS_SORT,
      })
      .connection({ first, after });
  }

  async count(
    filter?: RepositoryFilter<AccountDeletionRequestRecord>,
    organizationId?: string | null,
  ): Promise<number> {
    return this.accountDeletionRequestsRepository.count(
      applyTenantFilter(filter, organizationId),
    );
  }

  async findById(
    id: string,
    organizationId?: string | null,
  ): Promise<AccountDeletionRequest | null> {
    return this.findRecordById(id, organizationId);
  }

  async findRecordById(
    id: string,
    organizationId?: string | null,
  ): Promise<AccountDeletionRequestRecord | null> {
    const filter = applyTenantFilter({ id }, organizationId);
    const exists = await this.accountDeletionRequestsRepository.exists(filter);

    if (!exists) {
      return null;
    }

    return this.accountDeletionRequestsRepository.find(filter);
  }

  async review(
    input: ReviewAccountDeletionRequestInput,
    reviewedBy: string,
    organizationId?: string | null,
  ): Promise<AccountDeletionRequest> {
    const request = await this.findByIdOrThrow(input.requestId, organizationId);

    if (request.status !== AccountDeletionRequestStatus.PENDING) {
      throw new ForbiddenError(
        'Only pending account deletion requests can be reviewed.',
      );
    }

    const reviewNote = input.reviewNote?.trim() || null;

    if (input.status === AccountDeletionRequestStatus.REJECTED && !reviewNote) {
      throw new ValidationError(
        'A review note is required when rejecting a deletion request.',
      );
    }

    if (input.status === AccountDeletionRequestStatus.APPROVED) {
      const user = await this.usersService.findByEmail(request.email);

      if (user) {
        await this.authService.deleteSecurityForEmail(user.email);
        await this.usersService.deleteById(user.id);
      }
    }

    const now = new Date();

    await this.accountDeletionRequestsRepository.update(
      { id: request.id },
      {
        status: input.status,
        reviewNote,
        reviewedBy,
        reviewedAt: now,
        updatedAt: now,
      },
    );

    return this.accountDeletionRequestsRepository.find({ id: request.id });
  }

  private async findByIdOrThrow(
    id: string,
    organizationId?: string | null,
  ): Promise<AccountDeletionRequestRecord> {
    const request = await this.findRecordById(id, organizationId);

    if (!request) {
      throw new NotFoundError('Account deletion request not found.');
    }

    return request;
  }
}
