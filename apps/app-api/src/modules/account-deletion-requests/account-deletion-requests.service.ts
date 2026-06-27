import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
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
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  async submit(
    input: SubmitAccountDeletionRequestInput,
  ): Promise<AccountDeletionRequest> {
    const organization = await this.organizationsService.findById(input.organizationId);

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

  async list(
    filter?: RepositoryFilter<AccountDeletionRequestRecord>,
    sort?: RepositorySort<AccountDeletionRequestRecord>,
    first?: number,
    after?: string,
  ): Promise<Connection<AccountDeletionRequest>> {
    return this.accountDeletionRequestsRepository
      .list(filter, {
        sort: sort ?? ACCOUNT_DELETION_REQUESTS_SORT,
      })
      .connection({ first, after });
  }

  async count(
    filter?: RepositoryFilter<AccountDeletionRequestRecord>,
  ): Promise<number> {
    return this.accountDeletionRequestsRepository.count(filter);
  }

  async findById(id: string): Promise<AccountDeletionRequest | null> {
    return this.findRecordById(id);
  }

  async findRecordById(
    id: string,
  ): Promise<AccountDeletionRequestRecord | null> {
    const exists = await this.accountDeletionRequestsRepository.exists({ id });

    if (!exists) {
      return null;
    }

    return this.accountDeletionRequestsRepository.find({ id });
  }

  async review(
    input: ReviewAccountDeletionRequestInput,
    reviewedBy: string,
  ): Promise<AccountDeletionRequest> {
    const request = await this.findByIdOrThrow(input.requestId);

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
  ): Promise<AccountDeletionRequestRecord> {
    const request = await this.findRecordById(id);

    if (!request) {
      throw new NotFoundError('Account deletion request not found.');
    }

    return request;
  }
}
