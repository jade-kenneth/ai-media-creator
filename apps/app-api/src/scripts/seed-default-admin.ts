import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { z } from 'zod';
import { validateEnv } from '../config/env.schema';
import {
  createMongoConnectionOptions,
  resolveEnvFilePaths,
} from '../config/runtime-config';
import { RegistrationStatus, UserRole } from '../graphql/generated/graphql';
import type {
  UserRecord,
  UsersRepository,
} from '../modules/users/repositories/users.repository';
import { UsersRepositoryModule } from '../modules/users/repositories/users.repository.module';
import { TOKENS } from '../types/tokens';

const PASSWORD_SALT_ROUNDS = 10;
export const seedAdminEnvSchema = z.object({
  DEFAULT_ADMIN_EMAIL: z.email().trim().default('admin@organization.local'),
  DEFAULT_ADMIN_PASSWORD: z.string().trim().min(8).default('ChangeMe123!'),
});
export type SeedDefaultAdminEnv = z.infer<typeof seedAdminEnvSchema>;

export const seedSuperAdminEnvSchema = z.object({
  DEFAULT_SUPER_ADMIN_EMAIL: z.email().trim().default('superadmin@organization.local'),
  DEFAULT_SUPER_ADMIN_PASSWORD: z.string().trim().min(8).default('SuperAdmin123!'),
});
export type SeedSuperAdminEnv = z.infer<typeof seedSuperAdminEnvSchema>;

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
class SeedDefaultAdminModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    SeedDefaultAdminModule,
  );

  try {
    const usersRepository = app.get<UsersRepository>(TOKENS.USERS_REPOSITORY);
    const adminConfig = seedAdminEnvSchema.parse(process.env);
    const superAdminConfig = seedSuperAdminEnvSchema.parse(process.env);

    const [adminResult, superAdminResult] = await Promise.all([
      seedDefaultAdmin(usersRepository, adminConfig),
      seedDefaultSuperAdmin(usersRepository, superAdminConfig),
    ]);

    console.log(`\n--- Default Admin ---`);
    console.log(`  ${adminResult.action}: ${adminConfig.DEFAULT_ADMIN_EMAIL}`);
    console.log(`  Password:  ${adminConfig.DEFAULT_ADMIN_PASSWORD}`);
    console.log(`  Override:  DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD`);

    console.log(`\n--- Super Admin ---`);
    console.log(`  ${superAdminResult.action}: ${superAdminConfig.DEFAULT_SUPER_ADMIN_EMAIL}`);
    console.log(`  Password:  ${superAdminConfig.DEFAULT_SUPER_ADMIN_PASSWORD}`);
    console.log(`  Override:  DEFAULT_SUPER_ADMIN_EMAIL / DEFAULT_SUPER_ADMIN_PASSWORD`);
    console.log('');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown seed error.';

    console.error(`Failed to seed default admin user: ${message}`);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

export async function seedDefaultAdmin(
  usersRepository: UsersRepository,
  config: SeedDefaultAdminEnv,
  organizationId?: string | null,
): Promise<{ action: 'Created' | 'Updated' }> {
  const email = config.DEFAULT_ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(
    config.DEFAULT_ADMIN_PASSWORD,
    PASSWORD_SALT_ROUNDS,
  );
  const existingUser = await findUserByEmail(usersRepository, email);
  const now = new Date();

  if (existingUser) {
    await usersRepository.update(
      { email },
      {
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        registrationStatus: RegistrationStatus.approved,
        organizationId: organizationId ?? null,
        updatedAt: now,
      },
    );

    return { action: 'Updated' };
  }

  try {
    await usersRepository.create({
      id: new Types.ObjectId().toHexString(),
      email,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      registrationStatus: RegistrationStatus.approved,
      organizationId: organizationId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return { action: 'Created' };
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    await usersRepository.update(
      { email },
      {
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        registrationStatus: RegistrationStatus.approved,
        organizationId: organizationId ?? null,
        updatedAt: now,
      },
    );

    return { action: 'Updated' };
  }
}

export async function seedDefaultSuperAdmin(
  usersRepository: UsersRepository,
  config: SeedSuperAdminEnv,
): Promise<{ action: 'Created' | 'Updated' }> {
  const email = config.DEFAULT_SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(
    config.DEFAULT_SUPER_ADMIN_PASSWORD,
    PASSWORD_SALT_ROUNDS,
  );
  const existingUser = await findUserByEmail(usersRepository, email);
  const now = new Date();

  if (existingUser) {
    await usersRepository.update(
      { email },
      {
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        registrationStatus: RegistrationStatus.approved,
        organizationId: null,
        updatedAt: now,
      },
    );

    return { action: 'Updated' };
  }

  try {
    await usersRepository.create({
      id: new Types.ObjectId().toHexString(),
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      registrationStatus: RegistrationStatus.approved,
      organizationId: null,
      createdAt: now,
      updatedAt: now,
    });

    return { action: 'Created' };
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    await usersRepository.update(
      { email },
      {
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        registrationStatus: RegistrationStatus.approved,
        organizationId: null,
        updatedAt: now,
      },
    );

    return { action: 'Updated' };
  }
}

async function findUserByEmail(
  usersRepository: UsersRepository,
  email: string,
): Promise<UserRecord | null> {
  const exists = await usersRepository.exists({ email });

  if (!exists) {
    return null;
  }

  return usersRepository.find({ email });
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

if (require.main === module) {
  void bootstrap();
}
