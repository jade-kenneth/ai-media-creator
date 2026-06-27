import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ValidationError } from 'src/common/errors/app.error';
import { TOKENS } from 'src/types/tokens';
import type {
  SessionRecord,
  SessionsRepository,
} from './repositories/sessions.repository';

interface CreateSessionInput {
  accountId: string;
  jti: string;
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
      dateTimeCreated,
      dateTimeLastRefreshed: input.dateTimeLastRefreshed ?? dateTimeCreated,
    });
  }

  async findByJti(jti: string): Promise<SessionRecord | null> {
    const normalizedJti = jti.trim();

    if (!normalizedJti) {
      return null;
    }

    const filter = { jti: normalizedJti };
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
  ): Promise<SessionRecord | null> {
    const normalizedJti = jti.trim();

    if (!normalizedJti) {
      return null;
    }

    const filter = { jti: normalizedJti };
    const exists = await this.sessionsRepository.exists(filter);

    if (!exists) {
      return null;
    }

    await this.sessionsRepository.update(filter, {
      dateTimeLastRefreshed: refreshedAt,
    });

    return this.sessionsRepository.find(filter);
  }

  async deleteSessionByJti(jti: string): Promise<boolean> {
    const normalizedJti = jti;

    if (!normalizedJti) {
      return false;
    }

    const filter = { jti: normalizedJti };
    const exists = await this.sessionsRepository.exists(filter);

    if (!exists) {
      return false;
    }

    await this.sessionsRepository.delete(filter);

    return true;
  }

  async deleteSessionsByAccountId(accountId: string): Promise<void> {
    const normalizedAccountId = accountId;

    if (!normalizedAccountId) {
      return;
    }

    await this.sessionsRepository.delete({
      accountId: normalizedAccountId,
    });
  }
}
