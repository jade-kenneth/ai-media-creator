import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushPlatform } from 'src/graphql/generated/graphql';
import { TOKENS } from 'src/types/tokens';
import type {
  PushTokenRecord,
  PushTokensRepository,
} from '../push-tokens/repositories/push-tokens.repository';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_CHUNK_SIZE = 100;

export interface SendPushNotificationInput {
  body: string;
  title: string;
  userIds: string[];
  data?: Record<string, string>;
}

interface SendTestPushInput {
  body: string;
  title: string;
  userId?: string | null;
  organizationId: string;
}

interface SendTestPushResult {
  tokenCount: number;
}

interface ExpoPushMessage {
  body: string;
  data: Record<string, string>;
  sound: 'default';
  title: string;
  to: string;
}

interface ExpoPushTicket {
  details?: {
    error?: string;
  };
  message?: string;
  status: 'error' | 'ok';
}

interface ExpoPushResponse {
  data?: ExpoPushTicket[];
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
}

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    @Inject(TOKENS.PUSH_TOKENS_REPOSITORY)
    private readonly pushTokensRepository: PushTokensRepository,
    private readonly configService: ConfigService,
  ) {}

  async sendToUsers(input: SendPushNotificationInput): Promise<number> {
    if (
      input.userIds.length === 0 ||
      !this.configService.get<boolean>('EXPO_PUSH_ENABLED')
    ) {
      return 0;
    }

    const records = await this.pushTokensRepository
      .list({
        userId: {
          in: Array.from(new Set(input.userIds)),
        },
        platform: {
          in: [PushPlatform.ANDROID, PushPlatform.IOS],
        },
      })
      .collect();

    return this.sendRecords(
      records,
      input.title,
      input.body,
      input.data ?? {},
    );
  }

  async sendTestPush(input: SendTestPushInput): Promise<SendTestPushResult> {
    const filter: Record<string, unknown> = {
      organizationId: {
        equal: input.organizationId,
      },
      platform: {
        in: [PushPlatform.ANDROID, PushPlatform.IOS],
      },
    };

    if (input.userId) {
      filter.userId = { equal: input.userId };
    }

    const records = await this.pushTokensRepository.list(filter).collect();
    const tokenCount = await this.sendRecords(
      records,
      input.title,
      input.body,
      { type: 'test' },
    );

    return { tokenCount };
  }

  private async sendRecords(
    records: PushTokenRecord[],
    title: string,
    body: string,
    data: Record<string, string>,
  ): Promise<number> {
    const uniqueRecords = deduplicatePushTokens(records).filter((record) =>
      isExpoPushToken(record.token),
    );

    if (uniqueRecords.length === 0) {
      return 0;
    }

    const accessToken = this.configService.get<string>(
      'EXPO_PUSH_ACCESS_TOKEN',
    );

    for (const recordsChunk of chunkRecords(
      uniqueRecords,
      EXPO_PUSH_CHUNK_SIZE,
    )) {
      const messages = recordsChunk.map<ExpoPushMessage>((record) => ({
        to: record.token,
        title,
        body,
        sound: 'default',
        data,
      }));

      await this.sendChunk(messages, recordsChunk, accessToken);
    }

    return uniqueRecords.length;
  }

  private async sendChunk(
    messages: ExpoPushMessage[],
    recordsChunk: PushTokenRecord[],
    accessToken?: string,
  ): Promise<void> {
    try {
      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
          ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const responseText = await response.text();

        this.logger.warn(
          `Expo push send failed with status ${response.status}: ${responseText}`,
        );

        return;
      }

      const payload = (await response.json()) as ExpoPushResponse;

      if (payload.errors?.length) {
        this.logger.warn(
          `Expo push send returned errors: ${payload.errors
            .map((error) => error.message ?? error.code ?? 'Unknown error')
            .join(', ')}`,
        );
      }

      await this.cleanupInvalidTokens(recordsChunk, payload.data);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown push send error.';

      this.logger.warn(`Expo push send failed: ${reason}`);
    }
  }

  private async cleanupInvalidTokens(
    recordsChunk: PushTokenRecord[],
    tickets?: ExpoPushTicket[],
  ): Promise<void> {
    if (!tickets?.length) {
      return;
    }

    const invalidRecords = tickets.flatMap((ticket, index) => {
      if (
        ticket.status !== 'error' ||
        ticket.details?.error !== 'DeviceNotRegistered'
      ) {
        return [];
      }

      return [recordsChunk[index]].filter(Boolean);
    });

    await Promise.all(
      invalidRecords.map((record) =>
        this.pushTokensRepository.delete({
          token: record.token,
          platform: record.platform,
        }),
      ),
    );
  }
}

function deduplicatePushTokens(records: PushTokenRecord[]): PushTokenRecord[] {
  return Array.from(
    new Map(
      records.map((record) => [`${record.platform}:${record.token}`, record]),
    ).values(),
  );
}

function chunkRecords<T>(records: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < records.length; index += chunkSize) {
    chunks.push(records.slice(index, index + chunkSize));
  }

  return chunks;
}

function isExpoPushToken(token: string): boolean {
  return (
    /^ExpoPushToken\[[A-Za-z0-9\-_]+\]$/.test(token) ||
    /^ExponentPushToken\[[A-Za-z0-9\-_]+\]$/.test(token)
  );
}
