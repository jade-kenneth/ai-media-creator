import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { DateTimeResolver } from 'graphql-scalars';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { AppLoggerService } from './common/logger/app-logger.service';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { validateEnv } from './config/env.schema';
import {
  createMongoConnectionOptions,
  resolveEnvFilePaths,
} from './config/runtime-config';
import {
  createSecurityConfig,
  createThrottlerOptions,
} from './config/security-config';
import { createGraphqlErrorFormatter } from './graphql/format-error';
import { AccountDeletionRequestsModule } from './modules/account-deletion-requests/account-deletion-requests.module';
import { AdminManagementModule } from './modules/admin-management/admin-management.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AuthModule } from './modules/auth/auth.module';
import { CreditsModule } from './modules/credits/credits.module';
import { GenerationJobsModule } from './modules/generation-jobs/generation-jobs.module';
import {
  GenerationJobsWorker,
  UnservedJobsWatch,
} from './modules/generation-jobs/generation-jobs.worker';
import type { GraphqlContext } from './modules/auth/types/auth-context';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { FactsModule } from './modules/facts/facts.module';
import { MailModule } from './modules/mail/mail.module';
import { ProjectDuplicatesModule } from './modules/project-duplicates/project-duplicates.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { S3Module } from './modules/s3/s3.module';
import { SchedulerLocksModule } from './modules/scheduler-locks/scheduler-locks.module';
import { ScriptsModule } from './modules/scripts/scripts.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { TextGenerationModule } from './modules/text-generation/text-generation.module';
import { TurnstileModule } from './modules/turnstile/turnstile.module';
import { UsersModule } from './modules/users/users.module';
import { AiClipsModule } from './modules/ai-clips/ai-clips.module';
import { ExportsModule } from './modules/exports/exports.module';
import { VideoEditsModule } from './modules/video-edits/video-edits.module';
import { VoiceTracksModule } from './modules/voice-tracks/voice-tracks.module';
import { HealthResolver } from './resolver/health.resolver';
import { NodeResolver } from './resolver/node.resolver';

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
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const securityConfig = createSecurityConfig(configService);

        return createThrottlerOptions(securityConfig);
      },
    }),
    ScheduleModule.forRoot(),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          playground: !isProduction,
          includeStacktraceInErrorResponses: !isProduction,
          typePaths: [join(process.cwd(), 'src/graphql/schemas/**/*.gql')],
          definitions: {
            path: join(process.cwd(), 'src/graphql/generated/graphql.ts'),
            outputAs: 'interface',
            sortSchema: true,
          },
          // This line is the bridge between Nest GraphQL and the auth guards
          // This `context` function takes the incoming `req` and `res` and places them into the GraphQL execution context
          context: ({ req, res }): GraphqlContext => ({ req, res }),
          resolvers: {
            DateTime: DateTimeResolver,
          },
          formatError: createGraphqlErrorFormatter(isProduction),
        };
      },
    }),

    AuthModule,
    AccountDeletionRequestsModule,
    AssetsModule,
    AdminManagementModule,
    CreditsModule,
    GenerationJobsModule,
    OrganizationsModule,
    FactsModule,
    MailModule,
    ProjectDuplicatesModule,
    ProjectsModule,
    S3Module,
    SchedulerLocksModule,
    ScriptsModule,
    SessionsModule,
    TextGenerationModule,
    TurnstileModule,
    UsersModule,
    VideoEditsModule,
    VoiceTracksModule,
    ExportsModule,
    AiClipsModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    HealthResolver,
    NodeResolver,
    AppLoggerService,
    AppThrottlerGuard,
    // Text jobs run in this process; voice and render jobs run in src/worker.ts.
    GenerationJobsWorker,
    // Fails media jobs that wait while the media worker is down.
    UnservedJobsWatch,
    {
      provide: APP_GUARD,
      useExisting: AppThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
    consumer.apply(TenantMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
