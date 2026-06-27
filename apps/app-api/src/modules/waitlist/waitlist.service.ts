import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, ValidationError } from 'src/common/errors/app.error';
// import { AsyncEventDispatcher } from 'src/libs/async-event-module/async-event-dispatcher';
import type {
  Connection,
  RepositoryFilter,
  RepositorySort,
} from 'src/libs/repository';
import { TOKENS } from 'src/types/tokens';
import type {
  JoinWaitlistInput,
  WaitlistEntry,
  WaitlistStats,
} from '../../graphql/generated/graphql';
import type {
  WaitlistEntryRecord,
  WaitlistRepository,
} from './repositories/waitlist.repository';

export class AlreadyOnWaitlistError extends ConflictError {
  constructor(message = 'This email is already on the waitlist.') {
    super(message);
  }
}

@Injectable()
export class WaitlistService {
  constructor(
    @Inject(TOKENS.WAITLIST_REPOSITORY)
    private readonly waitlistRepository: WaitlistRepository,
  ) {}

  async join(input: JoinWaitlistInput): Promise<WaitlistEntry> {
    const email = input.email.trim().toLowerCase();

    if (!email) {
      throw new ValidationError('Email is required.');
    }

    if (await this.waitlistRepository.existsByEmail(email)) {
      throw new AlreadyOnWaitlistError();
    }

    try {
      const entry = await this.waitlistRepository.create({
        email,
        role: input.role,
        firstName: input.firstName?.trim() || null,
        lastName: input.lastName?.trim() || null,
        organizationName: input.organizationName?.trim() || null,
        city: input.city?.trim() || null,
        mobile: input.mobile?.trim() || null,
        message: input.message?.trim() || null,
      });

      // await this.events.dispatch('JoinWaitlist', { emailAddress: email });

      return entry;
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new AlreadyOnWaitlistError();
      }

      throw error;
    }
  }

  async list(
    filter?: RepositoryFilter<WaitlistEntryRecord>,
    sort?: RepositorySort<WaitlistEntryRecord>,
    first?: number,
    after?: string,
  ): Promise<Connection<WaitlistEntry>> {
    return this.waitlistRepository.findAll(filter, sort, first, after);
  }

  async stats(): Promise<WaitlistStats> {
    const byRole = await this.waitlistRepository.countByRole();

    return {
      total: byRole.reduce((total, item) => total + item.count, 0),
      byRole,
    };
  }

  async deleteEntry(id: string): Promise<boolean> {
    return this.waitlistRepository.deleteById(id);
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000
    );
  }
}
