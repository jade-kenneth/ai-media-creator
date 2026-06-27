import { Inject, Injectable } from '@nestjs/common';
import { hostname } from 'node:os';
import { Types } from 'mongoose';
import { TOKENS } from 'src/types/tokens';
import type { SchedulerLocksRepository } from './repositories/scheduler-locks.repository';

@Injectable()
export class SchedulerLockService {
  private readonly owner = `${hostname()}#${process.pid}`;

  constructor(
    @Inject(TOKENS.SCHEDULER_LOCKS_REPOSITORY)
    private readonly locks: SchedulerLocksRepository,
  ) {}

  async acquire(name: string, ttlMs: number): Promise<boolean> {
    const now = new Date();

    await this.locks.delete({ name, expiresAt: { lesserThan: now } });

    try {
      await this.locks.create({
        id: new Types.ObjectId().toHexString(),
        name,
        owner: this.owner,
        acquiredAt: now,
        expiresAt: new Date(now.getTime() + ttlMs),
      });

      return true;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return false;
      }

      throw error;
    }
  }

  async release(name: string): Promise<void> {
    await this.locks.delete({ name, owner: this.owner });
  }

  async withLock(
    name: string,
    ttlMs: number,
    task: () => Promise<void>,
  ): Promise<boolean> {
    const acquired = await this.acquire(name, ttlMs);

    if (!acquired) {
      return false;
    }

    try {
      await task();
    } finally {
      await this.release(name);
    }

    return true;
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}
