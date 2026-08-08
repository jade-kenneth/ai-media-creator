import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ValidationError } from 'src/common/errors/app.error';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import { TOKENS } from 'src/types/tokens';
import type {
  SessionRecord,
  SessionsRepository,
} from './repositories/sessions.repository';

interface CreateSessionInput {
  accountId: string;
  jti: string;
  organizationId?: string | null;
  dateTimeCreated?: Date;
  dateTimeLastRefreshed?: Date;
}
export type ValidateSessionResult = {
  ok: boolean;
  status: 200 | 403;
};
@Injectable()
export class SessionsService {
  constructor(
    @Inject(TOKENS.SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async createSession(input: CreateSessionInput): Promise<SessionRecord> {
    const accountId = input.accountId;

    if (!accountId) {
      throw new ValidationError('accountId cannot be empty.', {
        field: 'accountId',
      });
    }

    const jti = input.jti;

    if (!jti) {
      throw new ValidationError('jti cannot be empty.', {
        field: 'jti',
      });
    }

    const dateTimeCreated = input.dateTimeCreated ?? new Date();

    return this.sessionsRepository.create({
      accountId,
      jti,
      organizationId: input.organizationId ?? null,
      dateTimeCreated,
      dateTimeLastRefreshed: input.dateTimeLastRefreshed ?? dateTimeCreated,
    });
  }

  async findByJti(
    jti: string,
    organizationId?: string | null,
  ): Promise<SessionRecord | null> {
    const normalizedJti = jti.trim();

    if (!normalizedJti) {
      return null;
    }

    const filter = applyTenantFilter({ jti: normalizedJti }, organizationId);
    const exists = await this.sessionsRepository.exists(filter);

    if (!exists) {
      return null;
    }

    return this.sessionsRepository.find(filter);
  }

  async validateSession(jti: string): Promise<ValidateSessionResult> {
    const session = await this.findByJti(jti);

    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }

    return {
      ok: true,
      status: 200,
    };
  }

  async refreshSession(
    jti: string,
    refreshedAt: Date = new Date(),
    organizationId?: string | null,
  ): Promise<SessionRecord | null> {
    const normalizedJti = jti.trim();

    if (!normalizedJti) {
      return null;
    }

    const filter = applyTenantFilter({ jti: normalizedJti }, organizationId);
    const exists = await this.sessionsRepository.exists(filter);

    if (!exists) {
      return null;
    }

    await this.sessionsRepository.update(filter, {
      dateTimeLastRefreshed: refreshedAt,
    });

    return this.sessionsRepository.find(filter);
  }

  async deleteSessionByJti(
    jti: string,
    organizationId?: string | null,
  ): Promise<boolean> {
    const normalizedJti = jti;

    if (!normalizedJti) {
      return false;
    }

    const filter = applyTenantFilter({ jti: normalizedJti }, organizationId);
    const exists = await this.sessionsRepository.exists(filter);

    if (!exists) {
      return false;
    }

    await this.sessionsRepository.delete(filter);

    return true;
  }

  async deleteSessionsByAccountId(
    accountId: string,
    organizationId?: string | null,
  ): Promise<void> {
    const normalizedAccountId = accountId;

    if (!normalizedAccountId) {
      return;
    }

    await this.sessionsRepository.delete(
      applyTenantFilter({ accountId: normalizedAccountId }, organizationId),
    );
  }
}
