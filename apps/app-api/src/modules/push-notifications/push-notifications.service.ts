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

interface SendAnnouncementPublishedPushInput {
  announcementId: string;
  body: string;
  title: string;
  userIds: string[];
}

interface SendTestPushInput {
  body: string;
  title: string;
  userId?: string | null;
}

interface SendRegistrationStatusPushInput {
  body: string;
  title: string;
  userIds: string[];
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

  async sendAnnouncementPublished(
    input: SendAnnouncementPublishedPushInput,
  ): Promise<void> {
    await this.sendToUsers({
      userIds: input.userIds,
      title: input.title,
      body: input.body,
      data: {
        announcementId: input.announcementId,
        type: 'announcement',
      },
    });
  }

  async sendTestPush(input: SendTestPushInput): Promise<SendTestPushResult> {
    const filter: Record<string, unknown> = {
      platform: {
        in: [PushPlatform.ANDROID, PushPlatform.IOS],
      },
    };

    if (input.userId) {
      filter.userId = { equal: input.userId };
    }

    const pushTokenRecords = await this.pushTokensRepository
      .list(filter)
      .collect();

    const uniquePushTokenRecords = deduplicatePushTokens(
      pushTokenRecords,
    ).filter((record) => isExpoPushToken(record.token));

    if (uniquePushTokenRecords.length === 0) {
      return { tokenCount: 0 };
    }

    const accessToken = this.configService.get<string>(
      'EXPO_PUSH_ACCESS_TOKEN',
    );

    for (const recordsChunk of chunkRecords(
      uniquePushTokenRecords,
      EXPO_PUSH_CHUNK_SIZE,
    )) {
      const messages = recordsChunk.map<ExpoPushMessage>((record) => ({
        to: record.token,
        title: input.title,
        body: input.body,
        sound: 'default',
        data: { type: 'test' },
      }));

      await this.sendChunk(messages, recordsChunk, accessToken);
    }

    return { tokenCount: uniquePushTokenRecords.length };
  }

  async sendRegistrationApproved(
    input: SendRegistrationStatusPushInput,
  ): Promise<void> {
    await this.sendToUsers({
      userIds: input.userIds,
      title: input.title,
      body: input.body,
      data: {
        type: 'REGISTRATION_APPROVED',
      },
    });
  }

  async sendRegistrationRejected(
    input: SendRegistrationStatusPushInput,
  ): Promise<void> {
    await this.sendToUsers({
      userIds: input.userIds,
      title: input.title,
      body: input.body,
      data: {
        type: 'REGISTRATION_REJECTED',
      },
    });
  }

  private async sendToUsers(params: {
    userIds: string[];
    title: string;
    body: string;
    data: Record<string, string>;
  }): Promise<void> {
    if (!this.configService.get<boolean>('EXPO_PUSH_ENABLED')) {
      return;
    }

    const pushTokenRecords = await this.pushTokensRepository
      .list({
        userId: {
          in: params.userIds,
        },
        platform: {
          in: [PushPlatform.ANDROID, PushPlatform.IOS],
        },
      })
      .collect();

    const uniquePushTokenRecords = deduplicatePushTokens(
      pushTokenRecords,
    ).filter((record) => isExpoPushToken(record.token));

    if (uniquePushTokenRecords.length === 0) {
      return;
    }

    const accessToken = this.configService.get<string>(
      'EXPO_PUSH_ACCESS_TOKEN',
    );

    for (const recordsChunk of chunkRecords(
      uniquePushTokenRecords,
      EXPO_PUSH_CHUNK_SIZE,
    )) {
      const messages = recordsChunk.map<ExpoPushMessage>((record) => ({
        to: record.token,
        title: params.title,
        body: params.body,
        sound: 'default',
        data: params.data,
      }));

      await this.sendChunk(messages, recordsChunk, accessToken);
    }
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
      if (ticket.status !== 'error') {
        return [];
      }

      if (ticket.details?.error !== 'DeviceNotRegistered') {
        return [];
      }

      return [recordsChunk[index]].filter(Boolean);
    });

    if (invalidRecords.length === 0) {
      return;
    }

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
