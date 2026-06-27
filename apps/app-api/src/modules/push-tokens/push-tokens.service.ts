import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ValidationError } from 'src/common/errors/app.error';
import type {
  RegisterPushTokenInput,
  UnregisterPushTokenInput,
} from 'src/graphql/generated/graphql';
import { TOKENS } from 'src/types/tokens';
import type {
  PushDeviceMetadataRecord,
  PushTokensRepository,
} from './repositories/push-tokens.repository';

@Injectable()
export class PushTokensService {
  constructor(
    @Inject(TOKENS.PUSH_TOKENS_REPOSITORY)
    private readonly pushTokensRepository: PushTokensRepository,
  ) {}

  async registerPushToken(
    input: RegisterPushTokenInput,
    userId: string,
    organizationId?: string | null,
  ): Promise<boolean> {
    const token = input.token.trim();

    if (!token) {
      throw new ValidationError('token cannot be empty.', {
        field: 'token',
      });
    }

    const now = new Date();
    const rawDeviceMetadata: PushDeviceMetadataRecord | null =
      input.deviceMetadata
        ? {
            appOwnership: input.deviceMetadata.appOwnership?.trim() || null,
            appVersion: input.deviceMetadata.appVersion?.trim() || null,
            buildVersion: input.deviceMetadata.buildVersion?.trim() || null,
            deviceName: input.deviceMetadata.deviceName?.trim() || null,
            locale: input.deviceMetadata.locale?.trim() || null,
            osName: input.deviceMetadata.osName?.trim() || null,
            osVersion: input.deviceMetadata.osVersion?.trim() || null,
          }
        : null;
    const deviceMetadata =
      rawDeviceMetadata &&
      Object.values(rawDeviceMetadata).some((value) => value !== null)
        ? rawDeviceMetadata
        : null;
    const tokenFilter = {
      token,
      platform: input.platform,
    };

    const exists = await this.pushTokensRepository.exists(tokenFilter);

    if (!exists) {
      await this.pushTokensRepository.create({
        id: new Types.ObjectId().toHexString(),
        userId,
        organizationId: organizationId ?? null,
        token,
        platform: input.platform,
        deviceMetadata,
        createdAt: now,
        updatedAt: now,
      });

      return true;
    }

    await this.pushTokensRepository.update(tokenFilter, {
      userId,
      deviceMetadata,
      updatedAt: now,
    });

    return true;
  }

  async unregisterPushToken(
    input: UnregisterPushTokenInput,
    userId: string,
  ): Promise<boolean> {
    const token = input.token.trim();

    if (!token) {
      throw new ValidationError('token cannot be empty.', {
        field: 'token',
      });
    }

    const filter = {
      token,
      platform: input.platform,
      userId,
    };
    const exists = await this.pushTokensRepository.exists(filter);

    if (!exists) {
      return false;
    }

    await this.pushTokensRepository.delete(filter);

    return true;
  }
}
