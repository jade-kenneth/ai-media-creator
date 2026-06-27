import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { validateEnv } from '../config/env.schema';
import {
  createMongoConnectionOptions,
  resolveEnvFilePaths,
} from '../config/runtime-config';
import type { UsersRepository } from '../modules/users/repositories/users.repository';
import { UsersRepositoryModule } from '../modules/users/repositories/users.repository.module';
import { TOKENS } from '../types/tokens';
import {
  seedAdminEnvSchema,
  seedDefaultAdmin,
  seedDefaultSuperAdmin,
  seedSuperAdminEnvSchema,
} from './seed-default-admin';

const RESET_CONFIRMATION_VALUE = 'RESET_LOCAL_DATA';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: resolveEnvFilePaths(),
      validate: validateEnv,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createMongoConnectionOptions(configService),
    }),
    UsersRepositoryModule,
  ],
})
class ResetLocalDevModule {}

async function bootstrap() {
  assertResetConfirmation(process.env.LOCAL_DEV_RESET_CONFIRM);

  const app = await NestFactory.createApplicationContext(ResetLocalDevModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());
    const resetSummary = await resetAllCollections(connection);

    if (resetSummary.length === 0) {
      console.log('No collections were found to reset.');
    } else {
      for (const item of resetSummary) {
        console.log(
          `Cleared ${item.collectionName} (${item.deletedCount} docs).`,
        );
      }
    }

    const usersRepository = app.get<UsersRepository>(TOKENS.USERS_REPOSITORY);
    const adminConfig = seedAdminEnvSchema.parse(process.env);
    const superAdminConfig = seedSuperAdminEnvSchema.parse(process.env);

    await Promise.all([
      seedDefaultAdmin(usersRepository, adminConfig),
      seedDefaultSuperAdmin(usersRepository, superAdminConfig),
    ]);

    console.log(
      `Re-seeded default accounts. Admin login: ${adminConfig.DEFAULT_ADMIN_EMAIL}`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown reset error.';

    console.error(`Failed to reset local development data: ${message}`);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

function assertResetConfirmation(value: string | undefined): void {
  if (value === RESET_CONFIRMATION_VALUE) {
    return;
  }

  throw new Error(
    `Set LOCAL_DEV_RESET_CONFIRM=${RESET_CONFIRMATION_VALUE} to run this reset script.`,
  );
}

async function resetAllCollections(
  connection: Connection,
): Promise<Array<{ collectionName: string; deletedCount: number }>> {
  const database = connection.db;

  if (!database) {
    throw new Error('MongoDB database handle is unavailable.');
  }

  const existingCollections = await database
    .listCollections({}, { nameOnly: true })
    .toArray();
  const results: Array<{ collectionName: string; deletedCount: number }> = [];

  for (const { name } of existingCollections) {
    const result = await connection.collection(name).deleteMany({});

    results.push({
      collectionName: name,
      deletedCount: result.deletedCount ?? 0,
    });
  }

  return results;
}

void bootstrap();
