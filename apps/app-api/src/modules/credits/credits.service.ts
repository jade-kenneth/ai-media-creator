import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ConflictError } from 'src/common/errors/app.error';
import type { OwnerContext } from 'src/common/types/owner-context';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import {
  CreditEntryKind,
  type CreditSummary,
} from 'src/graphql/generated/graphql';
import { TOKENS } from 'src/types/tokens';
import type {
  CreditEntryRecord,
  CreditsLedgerRepository,
} from './repositories/credits-ledger.repository';
import type {
  CreditAccountRecord,
  CreditsRepository,
} from './repositories/credits.repository';

export type CreditOwner = OwnerContext;

export interface CreditMovement extends CreditOwner {
  amount: number;
  jobId: string;
  projectId: string | null;
  projectTitle: string | null;
  label: string;
}

const RECENT_USAGE_LIMIT = 5;

/**
 * Credits are held when a paid job starts, captured when it completes and
 * released when it fails, so a failed job is never charged (open decision 8).
 * Every movement writes one ledger entry.
 */
@Injectable()
export class CreditsService {
  constructor(
    @Inject(TOKENS.CREDITS_REPOSITORY)
    private readonly accounts: CreditsRepository,
    @Inject(TOKENS.CREDITS_LEDGER_REPOSITORY)
    private readonly ledger: CreditsLedgerRepository,
  ) {}

  async getBalance(owner: CreditOwner): Promise<number> {
    const account = await this.findAccount(owner);

    return account?.balance ?? 0;
  }

  async summary(owner: CreditOwner): Promise<CreditSummary> {
    const [account, entries] = await Promise.all([
      this.findAccount(owner),
      this.ledger
        .list(
          applyTenantFilter<CreditEntryRecord>(
            {
              ownerId: owner.ownerId,
              kind: {
                in: [
                  CreditEntryKind.GRANT,
                  CreditEntryKind.HOLD,
                  CreditEntryKind.RELEASE,
                ],
              },
            },
            owner.organizationId,
          ),
          { sort: { createdAt: 'DESC' } },
        )
        .connection({ first: RECENT_USAGE_LIMIT }),
    ]);

    return {
      balance: account?.balance ?? 0,
      held: account?.held ?? 0,
      recentUsage: entries.edges.map(({ node }) => ({
        id: node.id,
        label: node.label,
        projectTitle: node.projectTitle,
        amount: node.kind === CreditEntryKind.HOLD ? -node.amount : node.amount,
        kind: node.kind,
        createdAt: node.createdAt,
      })),
    };
  }

  async grant(owner: CreditOwner, amount: number, label: string) {
    if (amount <= 0) return;

    await this.ensureAccount(owner);
    await this.accounts.adjust(this.accountFilter(owner), {
      balance: amount,
      held: 0,
    });
    await this.record(owner, CreditEntryKind.GRANT, amount, label, null);
  }

  /** Reserves the job's cost; fails with a conflict when the balance is short. */
  async hold(movement: CreditMovement): Promise<void> {
    await this.ensureAccount(movement);

    const held = await this.accounts.adjust(
      this.accountFilter(movement),
      { balance: -movement.amount, held: movement.amount },
      movement.amount,
    );

    if (!held) {
      const balance = await this.getBalance(movement);

      throw new ConflictError(
        `You need ${movement.amount} credits. You have ${balance}.`,
        { code: 'INSUFFICIENT_CREDITS', required: movement.amount, balance },
      );
    }

    await this.record(
      movement,
      CreditEntryKind.HOLD,
      movement.amount,
      movement.label,
      movement,
    );
  }

  async capture(movement: CreditMovement): Promise<void> {
    await this.accounts.adjust(this.accountFilter(movement), {
      balance: 0,
      held: -movement.amount,
    });
    await this.record(
      movement,
      CreditEntryKind.CAPTURE,
      movement.amount,
      movement.label,
      movement,
    );
  }

  async release(
    movement: CreditMovement,
    label = 'Refunded: job failed',
  ): Promise<void> {
    await this.accounts.adjust(this.accountFilter(movement), {
      balance: movement.amount,
      held: -movement.amount,
    });
    await this.record(
      movement,
      CreditEntryKind.RELEASE,
      movement.amount,
      label,
      movement,
    );
  }

  private accountFilter(owner: CreditOwner) {
    return applyTenantFilter<CreditAccountRecord>(
      { ownerId: owner.ownerId },
      owner.organizationId,
    );
  }

  private async findAccount(
    owner: CreditOwner,
  ): Promise<CreditAccountRecord | null> {
    const [account] = await this.accounts
      .list(this.accountFilter(owner))
      .collect();

    return account ?? null;
  }

  private async ensureAccount(owner: CreditOwner): Promise<void> {
    if (await this.accounts.exists(this.accountFilter(owner))) return;

    const now = new Date();

    try {
      await this.accounts.create({
        id: new Types.ObjectId().toHexString(),
        ownerId: owner.ownerId,
        organizationId: owner.organizationId,
        balance: 0,
        held: 0,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      // A concurrent request created it first (unique ownerId); that's fine.
      if ((error as { code?: number }).code !== 11000) throw error;
    }
  }

  private async record(
    owner: CreditOwner,
    kind: CreditEntryKind,
    amount: number,
    label: string,
    movement: Pick<
      CreditMovement,
      'jobId' | 'projectId' | 'projectTitle'
    > | null,
  ): Promise<void> {
    await this.ledger.create({
      id: new Types.ObjectId().toHexString(),
      ownerId: owner.ownerId,
      organizationId: owner.organizationId,
      projectId: movement?.projectId ?? null,
      projectTitle: movement?.projectTitle ?? null,
      jobId: movement?.jobId ?? null,
      kind,
      amount,
      label,
      createdAt: new Date(),
    });
  }
}
