import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { validateEnv } from '../config/env.schema';
import {
  createMongoConnectionOptions,
  resolveEnvFilePaths,
} from '../config/runtime-config';
import {
  AngleKind,
  AngleType,
  CaptionStyle,
  ClaimFlagCategory,
  ContentStyle,
  CreditEntryKind,
  FactSource,
  FactStatus,
  FieldSource,
  GenerationFailureCode,
  GenerationJobStatus,
  GenerationJobType,
  HookType,
  ImportOutcome,
  Platform,
  PhotoMotion,
  PremiseKind,
  ProductField,
  ProjectStatus,
  SceneMediaKind,
  ScenePurpose,
  SceneTransition,
  ScriptLanguage,
  ScriptOriginKind,
  ShotFraming,
  ShotSubject,
  StoryGenre,
  Storytelling,
  Tone,
  UserRole,
  VoiceSource,
  StudioType,
} from '../graphql/generated/graphql';
import type { CreditsLedgerRepository } from '../modules/credits/repositories/credits-ledger.repository';
import type { CreditsRepository } from '../modules/credits/repositories/credits.repository';
import { CreditsRepositoryModule } from '../modules/credits/repositories/credits.repository.module';
import type {
  FactRecord,
  FactsRepository,
} from '../modules/facts/repositories/facts.repository';
import { FactsRepositoryModule } from '../modules/facts/repositories/facts.repository.module';
import type { GenerationJobsRepository } from '../modules/generation-jobs/repositories/generation-jobs.repository';
import { GenerationJobsRepositoryModule } from '../modules/generation-jobs/repositories/generation-jobs.repository.module';
import type { OrganizationsRepository } from '../modules/organizations/repositories/organizations.repository';
import { OrganizationsRepositoryModule } from '../modules/organizations/repositories/organizations.repository.module';
import {
  DEFAULT_STORY,
  factsFingerprint,
} from '../modules/projects/projects.service';
import type {
  ProjectRecord,
  ProjectsRepository,
} from '../modules/projects/repositories/projects.repository';
import { ProjectsRepositoryModule } from '../modules/projects/repositories/projects.repository.module';
import type {
  ScriptsRepository,
  ScriptVersionRecord,
} from '../modules/scripts/repositories/scripts.repository';
import { ScriptsRepositoryModule } from '../modules/scripts/repositories/scripts.repository.module';
import type { UsersRepository } from '../modules/users/repositories/users.repository';
import { UsersRepositoryModule } from '../modules/users/repositories/users.repository.module';
import type { VideoEditsRepository } from '../modules/video-edits/repositories/video-edits.repository';
import { VideoEditsRepositoryModule } from '../modules/video-edits/repositories/video-edits.repository.module';
import type { ExportsRepository } from '../modules/exports/repositories/exports.repository';
import { ExportsRepositoryModule } from '../modules/exports/repositories/exports.repository.module';
import { S3Service } from '../modules/s3/s3.service';
import { castLine } from '../modules/studios/story';
import type { VoiceTracksRepository } from '../modules/voice-tracks/repositories/voice-tracks.repository';
import { VoiceTracksRepositoryModule } from '../modules/voice-tracks/repositories/voice-tracks.repository.module';
import { TOKENS } from '../types/tokens';

/**
 * Seeds the canonical demo world (Product Specification §5) for the Google
 * account named by SEED_OWNER_EMAIL. Ids are derived from that email, so
 * running it again replaces the same records instead of adding copies.
 * Demo values only; no media files are seeded.
 */
const seedEnvSchema = z.object({
  SEED_OWNER_EMAIL: z
    .email(
      'Set SEED_OWNER_EMAIL to the Google account email that will own the demo projects.',
    )
    .trim()
    .toLowerCase(),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: resolveEnvFilePaths(),
      validate: (environment) => ({
        ...validateEnv(environment),
        ...seedEnvSchema.parse(environment),
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createMongoConnectionOptions(configService),
    }),
    UsersRepositoryModule,
    OrganizationsRepositoryModule,
    CreditsRepositoryModule,
    ProjectsRepositoryModule,
    FactsRepositoryModule,
    ScriptsRepositoryModule,
    GenerationJobsRepositoryModule,
    VideoEditsRepositoryModule,
    VoiceTracksRepositoryModule,
    ExportsRepositoryModule,
  ],
})
class SeedDemoModule {}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function seededId(ownerEmail: string, key: string): string {
  return createHash('sha256')
    .update(`${ownerEmail}:${key}`)
    .digest('hex')
    .slice(0, 24);
}

interface FactSeed {
  key: string;
  text: string;
  source: FactSource;
  status: FactStatus;
  note?: string;
  flag?: FactRecord['flag'];
}

/**
 * Renders and voiceovers made on the demo projects during QA would otherwise
 * outlive a re-seed and contradict the fresh video summaries. Uploaded assets
 * stay, as they always have, so a recording's own file is never removed.
 */
async function clearRendersAndVoiceovers(
  config: ConfigService,
  projectIds: string[],
  exportRecords: ExportsRepository,
  voiceTracks: VoiceTracksRepository,
) {
  const [renders, tracks] = await Promise.all([
    exportRecords.list({ projectId: { in: projectIds } }).collect(),
    voiceTracks.list({ projectId: { in: projectIds } }).collect(),
  ]);
  const keys = [
    ...renders.flatMap((record) => [record.videoKey, record.posterKey]),
    ...tracks
      .filter((track) => track.source === VoiceSource.AI)
      .flatMap((track) => track.segments.map((segment) => segment.audioKey)),
  ];

  if (keys.length) {
    let s3: S3Service | null = null;
    try {
      s3 = new S3Service(config);
    } catch {
      console.warn(
        `  S3 isn't configured, so ${keys.length} rendered or voiceover files were left in storage.`,
      );
    }
    if (s3) {
      const results = await Promise.allSettled(
        [...new Set(keys)].map((key) => s3.deleteObject(key)),
      );
      const failed = results.filter((result) => result.status === 'rejected');
      if (failed.length) {
        console.warn(`  ${failed.length} stored files couldn't be removed.`);
      }
    }
  }

  await exportRecords.delete({ projectId: { in: projectIds } });
  await voiceTracks.delete({ projectId: { in: projectIds } });
}

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The demo seed never runs in production.');
  }

  const { SEED_OWNER_EMAIL: email } = seedEnvSchema.parse(process.env);
  const app = await NestFactory.createApplicationContext(SeedDemoModule, {
    logger: ['error', 'warn'],
  });
  const id = (key: string) => seededId(email, key);
  const now = Date.now();
  const ago = (ms: number) => new Date(now - ms);

  try {
    const users = app.get<UsersRepository>(TOKENS.USERS_REPOSITORY);
    const organizations = app.get<OrganizationsRepository>(
      TOKENS.ORGANIZATION_REPOSITORY,
    );
    const accounts = app.get<CreditsRepository>(TOKENS.CREDITS_REPOSITORY);
    const ledger = app.get<CreditsLedgerRepository>(
      TOKENS.CREDITS_LEDGER_REPOSITORY,
    );
    const projects = app.get<ProjectsRepository>(TOKENS.PROJECTS_REPOSITORY);
    const facts = app.get<FactsRepository>(TOKENS.FACTS_REPOSITORY);
    const versions = app.get<ScriptsRepository>(TOKENS.SCRIPTS_REPOSITORY);
    const jobs = app.get<GenerationJobsRepository>(
      TOKENS.GENERATION_JOBS_REPOSITORY,
    );
    const videoEdits = app.get<VideoEditsRepository>(
      TOKENS.VIDEO_EDITS_REPOSITORY,
    );
    const voiceTracks = app.get<VoiceTracksRepository>(
      TOKENS.VOICE_TRACKS_REPOSITORY,
    );
    const exportRecords = app.get<ExportsRepository>(TOKENS.EXPORTS_REPOSITORY);

    // ── Creator and workspace ───────────────────────────────────────────────
    const [existingUser] = await users.list({ email }).collect();
    const organizationId = existingUser?.organizationId ?? id('workspace');

    if (!(await organizations.exists({ id: organizationId }))) {
      await organizations.create({
        id: organizationId,
        name: "Mika's workspace",
        slug: `ws-${organizationId}`,
        logoUrl: null,
        primaryColor: null,
        contactNumber: null,
        address: null,
        features: [],
        isActive: true,
        createdAt: ago(30 * DAY),
        updatedAt: ago(30 * DAY),
      });
    }

    let ownerId = existingUser?.id;

    if (existingUser) {
      await users.updateOne(
        { id: existingUser.id },
        {
          firstName: 'Mika',
          lastName: 'Reyes',
          organizationId,
          isActive: true,
          updatedAt: new Date(),
        },
      );
    } else {
      ownerId = id('user');
      await users.create({
        id: ownerId,
        email,
        passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
        role: UserRole.USER,
        isActive: true,
        organizationId,
        firstName: 'Mika',
        lastName: 'Reyes',
        position: null,
        createdAt: ago(30 * DAY),
        updatedAt: ago(30 * DAY),
      });
    }

    if (!ownerId) throw new Error('Could not resolve the demo owner.');

    const scope = { ownerId, organizationId };

    // ── Credits ─────────────────────────────────────────────────────────────
    await accounts.delete({ ownerId });
    await accounts.create({
      id: id('credit-account'),
      ...scope,
      balance: 128,
      held: 0,
      createdAt: ago(30 * DAY),
      updatedAt: ago(12 * MINUTE),
    });
    await ledger.delete({ ownerId });

    // ── Projects ────────────────────────────────────────────────────────────
    const blenderId = id('project-blender');
    const lampId = id('project-lamp');
    const fanId = id('project-fan');
    const bottleId = id('project-bottle');
    const draftId = id('project-draft');
    const storyId = id('project-story-umbrella');
    const storyDraftId = id('project-story-draft');
    const projectIds = [
      blenderId,
      lampId,
      fanId,
      bottleId,
      draftId,
      storyId,
      storyDraftId,
    ];

    await projects.delete({ id: { in: projectIds } });
    await facts.delete({ projectId: { in: projectIds } });
    await versions.delete({ projectId: { in: projectIds } });
    await jobs.delete({ projectId: { in: projectIds } });
    await videoEdits.delete({ projectId: { in: projectIds } });
    await clearRendersAndVoiceovers(
      app.get(ConfigService),
      projectIds,
      exportRecords,
      voiceTracks,
    );

    const entries = [
      {
        key: 'grant',
        kind: CreditEntryKind.GRANT,
        amount: 150,
        label: 'Starter credits',
        projectId: null,
        projectTitle: null,
        at: 30 * DAY,
      },
      {
        key: 'lamp-hold',
        kind: CreditEntryKind.HOLD,
        amount: 3,
        label: 'Write hooks & script',
        projectId: lampId,
        projectTitle: 'LED Desk Lamp, WFH Setup',
        at: 3 * DAY,
      },
      {
        key: 'lamp-release',
        kind: CreditEntryKind.RELEASE,
        amount: 3,
        label: 'Refunded: job failed',
        projectId: lampId,
        projectTitle: 'LED Desk Lamp, WFH Setup',
        at: 3 * DAY - MINUTE,
      },
      {
        key: 'blender-angles',
        kind: CreditEntryKind.HOLD,
        amount: 1,
        label: 'Suggest angles',
        projectId: blenderId,
        projectTitle: 'Portable Blender, Morning Smoothie Hook',
        at: 2 * HOUR,
      },
      {
        key: 'blender-script',
        kind: CreditEntryKind.HOLD,
        amount: 3,
        label: 'Write hooks & script',
        projectId: blenderId,
        projectTitle: 'Portable Blender, Morning Smoothie Hook',
        at: 40 * MINUTE,
      },
    ];
    for (const entry of entries) {
      await ledger.create({
        id: id(`ledger-${entry.key}`),
        ...scope,
        projectId: entry.projectId,
        projectTitle: entry.projectTitle,
        jobId: null,
        kind: entry.kind,
        amount: entry.amount,
        label: entry.label,
        createdAt: ago(entry.at),
      });
    }

    const baseStrategy = {
      buyer: null,
      problem: null,
      benefit: null,
      platform: Platform.TIKTOK_SHOP,
      language: ScriptLanguage.TAGLISH,
      lengthSeconds: 30,
      tone: Tone.FRIENDLY,
      contentStyle: ContentStyle.VOICEOVER_PRODUCT_SHOTS,
      selectedAngle: null,
    };

    const insertFacts = async (
      projectId: string,
      seeds: FactSeed[],
      at: number,
    ) => {
      const records: FactRecord[] = [];
      for (const [index, seed] of seeds.entries()) {
        const record: FactRecord = {
          id: id(`fact-${projectId}-${seed.key}`),
          ...scope,
          projectId,
          featureId: null,
          text: seed.text,
          source: seed.source,
          sourceUrl:
            seed.source === FactSource.LISTING
              ? 'https://shop.example/listing/blendgo-mini-380'
              : null,
          sourceNote:
            seed.source === FactSource.CREATOR
              ? 'Checked the box myself'
              : null,
          status: seed.status,
          note: seed.note ?? null,
          flag: seed.flag ?? null,
          createdAt: ago(at - index * 1000),
          updatedAt: ago(at - index * 1000),
        };
        await facts.create(record);
        records.push(record);
      }
      const count = (status: FactStatus) =>
        records.filter((fact) => fact.status === status).length;
      return {
        records,
        factsSummary: {
          total: records.length,
          unreviewed: count(FactStatus.UNREVIEWED),
          approved: count(FactStatus.APPROVED),
          rejected: count(FactStatus.REJECTED),
          unknown: count(FactStatus.UNKNOWN),
        },
        approvedFacts: records
          .filter((fact) => fact.status === FactStatus.APPROVED)
          .map((fact) => ({ id: fact.id, text: fact.text })),
      };
    };

    const project = (
      values: Partial<ProjectRecord> &
        Pick<ProjectRecord, 'id' | 'title' | 'status' | 'updatedAt'>,
    ): ProjectRecord => ({
      ownerId,
      organizationId,
      studioType: StudioType.AFFILIATE,
      titleSort: values.title.toLowerCase(),
      product: {
        title: null,
        category: null,
        pricePhp: null,
        description: null,
        affiliateUrl: null,
        features: [],
        fieldSources: {},
        importUrl: null,
        lastImport: null,
      },
      strategy: baseStrategy,
      angleSuggestionSet: null,
      factsSummary: {
        total: 0,
        unreviewed: 0,
        approved: 0,
        rejected: 0,
        unknown: 0,
      },
      approvedFacts: [],
      scriptSummary: {
        versionCount: 0,
        latestNumber: 0,
        latestIsDraft: false,
        approved: [],
      },
      thumbnailKey: null,
      assetCount: 0,
      createdAt: new Date(values.updatedAt.getTime() - 2 * DAY),
      ...values,
    });

    // Portable Blender (hero): facts reviewed, angle chosen, v3 approved.
    const blenderFacts = await insertFacts(
      blenderId,
      [
        {
          key: 'capacity',
          text: 'Holds 380 ml',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
        {
          key: 'usbc',
          text: 'Charges by USB-C',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
        {
          key: 'blades',
          text: '6 stainless-steel blades',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
        {
          key: 'ice',
          text: 'Blends ice in 10 seconds',
          source: FactSource.LISTING,
          status: FactStatus.REJECTED,
          flag: {
            category: ClaimFlagCategory.PERFORMANCE,
            lead: 'Performance claim.',
            reason:
              'Speed and results claims need proof the listing doesn’t show. Approve it only if you’ve checked it yourself.',
            claim: 'in 10 seconds',
          },
        },
        {
          key: 'weight',
          text: 'Weighs 420 g',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
        {
          key: 'bpa',
          text: 'BPA-free cup',
          source: FactSource.CREATOR,
          status: FactStatus.APPROVED,
        },
        {
          key: 'battery',
          text: 'Battery life',
          source: FactSource.NOT_STATED,
          status: FactStatus.UNKNOWN,
        },
        {
          key: 'dishwasher',
          text: 'Dishwasher safe',
          source: FactSource.CREATOR,
          status: FactStatus.REJECTED,
          note: 'Box says hand-wash only.',
        },
      ],
      3 * HOUR,
    );
    const [capacity, usbc, blades, , weight, bpa] = blenderFacts.records;

    const blenderAngles = [
      {
        id: id('angle-bag'),
        type: AngleType.USE_CASE,
        title: 'Breakfast that fits in your bag',
        pitch:
          'Blend a smoothie on the commute: small enough for any tote, charges like your phone.',
        factIds: [capacity.id, usbc.id, weight.id],
      },
      {
        id: id('angle-usbc'),
        type: AngleType.FEATURE_DEMO,
        title: 'Charge it over USB-C',
        pitch:
          'Show it topping up from a power bank, then blending at the office desk.',
        factIds: [usbc.id, blades.id],
      },
      {
        id: id('angle-skip'),
        type: AngleType.PROBLEM_SOLUTION,
        title: 'No more skipped breakfast',
        pitch:
          'Start with the rushed morning, end with a smoothie made in the cup you drink from.',
        factIds: [capacity.id, bpa.id],
      },
    ];

    const hooks = [
      {
        id: id('hook-1'),
        type: HookType.PROBLEM_FIRST,
        text: 'Late ka na naman sa breakfast? Ito ang kasya sa bag mo.',
        openingShot:
          'Hand pulling the blender out of a tote bag at a bus stop.',
        reportedClaims: [],
      },
      {
        id: id('hook-2'),
        type: HookType.QUESTION,
        text: 'Paano kung ready na ang smoothie mo bago pa dumating ang jeep?',
        openingShot:
          'Close-up of the USB-C port as it plugs into a power bank.',
        reportedClaims: ['USB-C'],
      },
      {
        id: id('hook-3'),
        type: HookType.SHOW_DONT_TELL,
        text: '380 ml, isang pindot, sa desk mo na.',
        openingShot:
          'Top-down shot of fruit going into the cup on an office desk.',
        reportedClaims: ['380 ml'],
      },
    ];
    const scenes = [
      {
        id: id('scene-1'),
        order: 1,
        purpose: ScenePurpose.HOOK,
        durationSeconds: 4,
        narration: 'Late ka na naman sa breakfast? Ito ang kasya sa bag mo.',
        onScreenText: 'Breakfast, pero portable',
        visual: 'Hand pulling the blender out of a tote bag at a bus stop.',
        direction: {
          inFrame: ShotSubject.HANDS,
          framing: ShotFraming.CLOSE_UP,
          setting: 'Bus stop, early morning',
          props: 'Tote bag',
        },
        transitionIn: SceneTransition.CUT,
        cta: null,
        factIds: [],
        reportedClaims: [],
      },
      {
        id: id('scene-2'),
        order: 2,
        purpose: ScenePurpose.PROBLEM,
        durationSeconds: 6,
        narration:
          'Alam ko, walang time mag-almusal pag rush hour. Kaya sa bag ko na lang siya dinadala.',
        onScreenText: 'Walang time? Same.',
        visual: 'Quick cuts of a busy morning: keys, shoes, the door closing.',
        direction: {
          inFrame: ShotSubject.HANDS,
          framing: ShotFraming.CLOSE_UP,
          setting: 'Apartment doorway, early morning',
          props: 'Keys, shoes',
        },
        transitionIn: SceneTransition.WHIP,
        cta: null,
        factIds: [],
        reportedClaims: [],
      },
      {
        id: id('scene-3'),
        order: 3,
        purpose: ScenePurpose.FEATURE,
        durationSeconds: 7,
        narration:
          'Holds 380 ml ang cup, sakto para sa isang smoothie, at BPA-free cup pa siya.',
        onScreenText: '380 ml · BPA-free cup',
        visual: 'Fruit and milk poured into the cup on a desk.',
        direction: {
          inFrame: ShotSubject.HANDS,
          framing: ShotFraming.OVERHEAD,
          setting: 'Office desk, daylight',
          props: 'Banana, milk carton',
        },
        transitionIn: SceneTransition.CUT,
        cta: null,
        factIds: [capacity.id, bpa.id],
        reportedClaims: ['Holds 380 ml', 'BPA-free cup'],
      },
      {
        id: id('scene-4'),
        order: 4,
        purpose: ScenePurpose.DEMO,
        durationSeconds: 7,
        narration:
          'May 6 stainless-steel blades siya, at charges by USB-C, kaya kahit power bank lang, okay na.',
        onScreenText: 'Charges by USB-C',
        visual:
          'Blender running, then the USB-C cable plugged into a power bank.',
        direction: {
          inFrame: ShotSubject.PRODUCT_ONLY,
          framing: ShotFraming.CLOSE_UP,
          setting: 'Office desk, daylight',
          props: 'Power bank, USB-C cable',
        },
        transitionIn: SceneTransition.PUNCH_IN,
        cta: null,
        factIds: [blades.id, usbc.id],
        reportedClaims: ['6 stainless-steel blades', 'charges by USB-C'],
      },
      {
        id: id('scene-5'),
        order: 5,
        purpose: ScenePurpose.CALL_TO_ACTION,
        durationSeconds: 6,
        narration:
          'Gusto mo rin ng breakfast na kasya sa bag? Nasa orange cart ang link.',
        onScreenText: 'Link sa orange cart',
        visual: 'Smoothie finished, lid on, dropped back into the bag.',
        direction: {
          inFrame: ShotSubject.HANDS,
          framing: ShotFraming.MEDIUM,
          setting: 'Office desk, daylight',
          props: 'Tote bag',
        },
        transitionIn: SceneTransition.CUT,
        cta: 'Tap the orange cart to check today’s price.',
        factIds: [],
        reportedClaims: [],
      },
    ];
    const caption =
      'Breakfast na kasya sa bag 🥤 380 ml, USB-C, BPA-free cup. #affiliate #ad';
    const usedFacts = [capacity, bpa, blades, usbc].map((fact) => ({
      id: fact.id,
      text: fact.text,
    }));
    const version = (
      number: number,
      values: Partial<ScriptVersionRecord>,
    ): ScriptVersionRecord => ({
      id: id(`blender-v${number}`),
      ...scope,
      projectId: blenderId,
      number,
      status: 'DRAFT',
      origin: { kind: ScriptOriginKind.WRITTEN, fromNumber: null },
      angleTitle: 'Breakfast that fits in your bag',
      language: ScriptLanguage.TAGLISH,
      lengthSeconds: 30,
      hooks,
      selectedHookId: hooks[0].id,
      scenes,
      shoot: {
        scenario:
          'An office worker running late grabs the blender on the way out, then makes a smoothie at their desk.',
        presenter:
          'Office worker in their 20s, heard in voiceover; only their hands and smart-casual sleeves show.',
      },
      caption,
      approvedAt: null,
      approvedFactSnapshot: [],
      createdAt: ago(3 * HOUR),
      updatedAt: ago(3 * HOUR),
      ...values,
    });

    await versions.create(
      version(1, {
        angleTitle: 'Charge it over USB-C',
        selectedHookId: null,
        createdAt: ago(2 * DAY),
        updatedAt: ago(2 * DAY),
      }),
    );
    await versions.create(
      version(2, {
        selectedHookId: null,
        createdAt: ago(DAY),
        updatedAt: ago(DAY),
      }),
    );
    await versions.create(
      version(3, {
        status: 'APPROVED',
        approvedAt: new Date('2026-09-23T02:42:00Z'),
        approvedFactSnapshot: usedFacts,
        createdAt: ago(40 * MINUTE),
        updatedAt: ago(12 * MINUTE),
      }),
    );

    await projects.create(
      project({
        id: blenderId,
        title: 'Portable Blender, Morning Smoothie Hook',
        status: ProjectStatus.MEDIA_REVIEW,
        updatedAt: ago(12 * MINUTE),
        product: {
          title: 'BlendGo Mini Portable Blender',
          category: 'Kitchen & Dining',
          pricePhp: 899,
          description:
            'A 380 ml portable blender with six stainless-steel blades that charges over USB-C.',
          affiliateUrl: 'https://shop.example/blendgo-mini',
          features: [
            {
              id: id('feature-capacity'),
              text: 'Holds 380 ml',
              source: FieldSource.IMPORTED,
            },
            {
              id: id('feature-usbc'),
              text: 'Charges by USB-C',
              source: FieldSource.IMPORTED,
            },
            {
              id: id('feature-bpa'),
              text: 'BPA-free cup',
              source: FieldSource.CREATOR,
            },
          ],
          fieldSources: {
            [ProductField.TITLE]: FieldSource.IMPORTED,
            [ProductField.CATEGORY]: FieldSource.CREATOR,
            [ProductField.PRICE]: FieldSource.IMPORTED,
            [ProductField.DESCRIPTION]: FieldSource.EDITED,
            [ProductField.AFFILIATE_URL]: FieldSource.CREATOR,
          },
          importUrl: 'https://shop.example/listing/blendgo-mini-380',
          lastImport: {
            outcome: ImportOutcome.PARTIAL,
            host: 'shop.example',
            filled: [
              ProductField.TITLE,
              ProductField.PRICE,
              ProductField.DESCRIPTION,
            ],
            missing: [ProductField.CATEGORY, ProductField.FEATURES],
            at: ago(3 * HOUR),
          },
        },
        strategy: {
          ...baseStrategy,
          buyer: 'Office workers who skip breakfast',
          problem: 'No time to eat before the commute',
          benefit: 'A filling breakfast they can take along',
          selectedAngle: {
            kind: AngleKind.SUGGESTED,
            suggestionId: blenderAngles[0].id,
            text: blenderAngles[0].title,
          },
        },
        angleSuggestionSet: {
          suggestions: blenderAngles,
          factsFingerprint: factsFingerprint(blenderFacts.approvedFacts),
          createdAt: ago(2 * HOUR),
        },
        factsSummary: blenderFacts.factsSummary,
        approvedFacts: blenderFacts.approvedFacts,
        scriptSummary: {
          versionCount: 3,
          latestNumber: 3,
          latestIsDraft: false,
          approved: [{ versionId: id('blender-v3'), number: 3, usedFacts }],
        },
        videoSummary: {
          scriptVersionId: id('blender-v3'),
          mediaComplete: true,
          voiceSettled: true,
          exportCount: 0,
          latestExportAt: null,
          posterKey: null,
          latestExportDownloaded: false,
        },
      }),
    );

    await videoEdits.create({
      id: id('video-edit-blender'),
      ...scope,
      projectId: blenderId,
      scriptVersionId: id('blender-v3'),
      scriptVersionNumber: 3,
      scenes: scenes.map((scene) => ({
        sceneId: scene.id,
        order: scene.order,
        purpose: scene.purpose,
        narration: scene.narration,
        visual: scene.visual,
        onScreenText: scene.onScreenText,
        transitionIn: scene.transitionIn,
        direction: scene.direction ?? null,
        cta: scene.cta,
        durationSeconds: scene.durationSeconds,
        media: {
          kind: SceneMediaKind.TEXT_CARD,
          assetId: null,
          motion: PhotoMotion.STILL,
          clipStartSeconds: 0,
        },
      })),
      voice: {
        source: VoiceSource.NONE,
        voiceId: null,
        speed: 1,
        pronunciations: [],
        trackId: null,
      },
      captions: {
        enabled: true,
        style: CaptionStyle.BOXED,
        lines: [],
        builtFromTrackId: null,
      },
      musicLevelPercent: 20,
      endCardEnabled: true,
      postCaption: caption,
      adTag: true,
      createdAt: ago(12 * MINUTE),
      updatedAt: ago(12 * MINUTE),
    });

    // LED Desk Lamp: strategy set, script writing failed (not charged).
    const lampFacts = await insertFacts(
      lampId,
      [
        {
          key: 'modes',
          text: '3 colour temperatures',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
        {
          key: 'usb',
          text: 'Powered by USB',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
        {
          key: 'clamp',
          text: 'Clamps to desks up to 5 cm thick',
          source: FactSource.CREATOR,
          status: FactStatus.APPROVED,
        },
      ],
      3 * DAY + HOUR,
    );
    await projects.create(
      project({
        id: lampId,
        title: 'LED Desk Lamp, WFH Setup',
        status: ProjectStatus.SCRIPT_REVIEW,
        updatedAt: ago(3 * DAY),
        product: {
          title: 'Lumo Clamp LED Desk Lamp',
          category: 'Home Office',
          pricePhp: 649,
          description: null,
          affiliateUrl: 'https://shop.example/lumo-clamp',
          features: [],
          fieldSources: {
            [ProductField.TITLE]: FieldSource.CREATOR,
            [ProductField.AFFILIATE_URL]: FieldSource.CREATOR,
          },
          importUrl: null,
          lastImport: null,
        },
        strategy: {
          ...baseStrategy,
          buyer: 'People working from a small desk at home',
          language: ScriptLanguage.ENGLISH,
          selectedAngle: {
            kind: AngleKind.OWN,
            suggestionId: null,
            text: 'A desk that still looks good on camera at night',
          },
        },
        factsSummary: lampFacts.factsSummary,
        approvedFacts: lampFacts.approvedFacts,
      }),
    );
    await jobs.create({
      id: id('job-lamp-script'),
      ...scope,
      projectId: lampId,
      projectTitle: 'LED Desk Lamp, WFH Setup',
      type: GenerationJobType.WRITE_SCRIPT,
      label: 'Write hooks & script',
      status: GenerationJobStatus.FAILED,
      step: 1,
      stepCount: 3,
      input: { versionId: null, hookId: null, sceneId: null },
      idempotencyKey: id('job-lamp-script-key'),
      creditCost: 3,
      attempts: 1,
      leaseUntil: null,
      failureCode: GenerationFailureCode.PROVIDER_TIMEOUT,
      failureMessage: 'The writing service timed out after 3 minutes.',
      resultVersionId: null,
      createdAt: ago(3 * DAY),
      updatedAt: ago(3 * DAY - MINUTE),
      startedAt: ago(3 * DAY),
      finishedAt: ago(3 * DAY - MINUTE),
    });

    // Cordless Neck Fan: two facts still need review.
    const fanFacts = await insertFacts(
      fanId,
      [
        {
          key: 'speeds',
          text: '3 fan speeds',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
        {
          key: 'bladeless',
          text: 'Bladeless design',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
        {
          key: 'hours',
          text: 'Runs up to 8 hours on low',
          source: FactSource.LISTING,
          status: FactStatus.UNREVIEWED,
        },
        {
          key: 'best',
          text: 'The best neck fan for commuting',
          source: FactSource.LISTING,
          status: FactStatus.UNREVIEWED,
          flag: {
            category: ClaimFlagCategory.SUPERLATIVE,
            lead: 'Superlative.',
            reason:
              'Superlatives like ‘best’ or ‘#1’ need proof. Describe the specific feature instead.',
            claim: 'best',
          },
        },
      ],
      2 * HOUR + MINUTE,
    );
    await projects.create(
      project({
        id: fanId,
        title: 'Cordless Neck Fan, Commute Angle',
        status: ProjectStatus.FACTS_REVIEW,
        updatedAt: ago(2 * HOUR),
        product: {
          title: 'BreezeLoop Cordless Neck Fan',
          category: 'Personal Care',
          pricePhp: 499,
          description: null,
          affiliateUrl: 'https://shop.example/breezeloop',
          features: [],
          fieldSources: {
            [ProductField.TITLE]: FieldSource.CREATOR,
            [ProductField.AFFILIATE_URL]: FieldSource.CREATOR,
          },
          importUrl: null,
          lastImport: null,
        },
        factsSummary: fanFacts.factsSummary,
        approvedFacts: fanFacts.approvedFacts,
      }),
    );

    // Collapsible Water Bottle: script approved, brief ready.
    const bottleFacts = await insertFacts(
      bottleId,
      [
        {
          key: 'folds',
          text: 'Folds down to 4 cm',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
        {
          key: 'size',
          text: 'Holds 600 ml',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
        {
          key: 'silicone',
          text: 'Food-grade silicone body',
          source: FactSource.LISTING,
          status: FactStatus.APPROVED,
        },
      ],
      DAY + HOUR,
    );
    const [folds, size] = bottleFacts.records;
    const bottleUsed = [folds, size].map((fact) => ({
      id: fact.id,
      text: fact.text,
    }));
    const bottleHooks = [
      {
        id: id('bottle-hook-1'),
        type: HookType.SHOW_DONT_TELL,
        text: 'Watch this bottle disappear into my pocket.',
        openingShot: 'Bottle squashed flat and slid into a hiking pant pocket.',
        reportedClaims: [],
      },
      {
        id: id('bottle-hook-2'),
        type: HookType.QUESTION,
        text: 'Why is your water bottle taking up half your bag?',
        openingShot: 'An overstuffed day pack on a trail bench.',
        reportedClaims: [],
      },
      {
        id: id('bottle-hook-3'),
        type: HookType.RELATABLE_MOMENT,
        text: 'Every hike, the same problem: the bottle.',
        openingShot: 'Trail start sign, bottle swinging from a strap.',
        reportedClaims: [],
      },
    ];
    await versions.create({
      id: id('bottle-v1'),
      ...scope,
      projectId: bottleId,
      number: 1,
      status: 'APPROVED',
      origin: { kind: ScriptOriginKind.WRITTEN, fromNumber: null },
      angleTitle: 'Light enough for any trail',
      language: ScriptLanguage.ENGLISH,
      lengthSeconds: 20,
      hooks: bottleHooks,
      selectedHookId: bottleHooks[0].id,
      scenes: [
        {
          id: id('bottle-scene-1'),
          order: 1,
          purpose: ScenePurpose.HOOK,
          durationSeconds: 4,
          narration: 'Watch this bottle disappear into my pocket.',
          onScreenText: 'Pocket-sized?',
          visual: 'Bottle squashed flat and slid into a pocket.',
          direction: {
            inFrame: ShotSubject.HANDS,
            framing: ShotFraming.CLOSE_UP,
            setting: 'Trailhead, morning',
            props: 'Hiking pants',
          },
          cta: null,
          factIds: [],
          reportedClaims: [],
        },
        {
          id: id('bottle-scene-2'),
          order: 2,
          purpose: ScenePurpose.FEATURE,
          durationSeconds: 8,
          narration:
            'It holds 600 ml on the trail, then folds down to 4 cm when it’s empty.',
          onScreenText: '600 ml → 4 cm',
          visual: 'Filling at a spring, then folding it flat.',
          direction: {
            inFrame: ShotSubject.HANDS,
            framing: ShotFraming.MEDIUM,
            setting: 'Mountain spring, daylight',
            props: '',
          },
          cta: null,
          factIds: [size.id, folds.id],
          reportedClaims: ['holds 600 ml', 'folds down to 4 cm'],
        },
        {
          id: id('bottle-scene-3'),
          order: 3,
          purpose: ScenePurpose.CALL_TO_ACTION,
          durationSeconds: 8,
          narration: 'Link is in the cart if your bag needs the space back.',
          onScreenText: 'Link in the cart',
          visual: 'Pack zipped closed with room to spare.',
          direction: {
            inFrame: ShotSubject.PRODUCT_ONLY,
            framing: ShotFraming.MEDIUM,
            setting: 'Trail bench, daylight',
            props: 'Day pack',
          },
          cta: 'Tap the cart to see the listing.',
          factIds: [],
          reportedClaims: [],
        },
      ],
      shoot: {
        scenario:
          'A day hiker packs light and shows the bottle folding away between stops.',
        presenter: null,
      },
      caption: 'Your bag wants its space back. #hiking #affiliate #ad',
      approvedAt: ago(DAY),
      approvedFactSnapshot: bottleUsed,
      createdAt: ago(DAY + HOUR),
      updatedAt: ago(DAY),
    });
    await projects.create(
      project({
        id: bottleId,
        title: 'Collapsible Water Bottle, Hiking',
        status: ProjectStatus.SCRIPT_REVIEW,
        updatedAt: ago(DAY),
        product: {
          title: 'FoldFlow Collapsible Bottle',
          category: 'Sports & Outdoors',
          pricePhp: 399,
          description: null,
          affiliateUrl: 'https://shop.example/foldflow',
          features: [],
          fieldSources: {
            [ProductField.TITLE]: FieldSource.CREATOR,
            [ProductField.AFFILIATE_URL]: FieldSource.CREATOR,
          },
          importUrl: null,
          lastImport: null,
        },
        strategy: {
          ...baseStrategy,
          buyer: 'Weekend hikers who pack light',
          language: ScriptLanguage.ENGLISH,
          lengthSeconds: 20,
          tone: Tone.ENERGETIC,
          selectedAngle: {
            kind: AngleKind.OWN,
            suggestionId: null,
            text: 'Light enough for any trail',
          },
        },
        factsSummary: bottleFacts.factsSummary,
        approvedFacts: bottleFacts.approvedFacts,
        scriptSummary: {
          versionCount: 1,
          latestNumber: 1,
          latestIsDraft: false,
          approved: [
            { versionId: id('bottle-v1'), number: 1, usedFacts: bottleUsed },
          ],
        },
      }),
    );

    // Untitled draft with no product.
    await projects.create(
      project({
        id: draftId,
        title: 'Untitled project',
        status: ProjectStatus.DRAFT,
        updatedAt: ago(5 * DAY),
      }),
    );

    // The Umbrella Standoff (§3.23): an acted Taglish comedy, v1 approved,
    // ending on a cliffhanger (R29). No media and no video edit.
    const storyCast = [
      {
        id: 'cast-ana-0001',
        name: 'Ana',
        role: 'A nurse heading home after a night shift',
        look: '20s, yellow raincoat, short hair',
      },
      {
        id: 'cast-ben-0001',
        name: 'Ben',
        role: 'A delivery rider on a break',
        look: '20s, green rider jacket, helmet under his arm',
      },
    ];
    const storyPremise =
      "Two strangers fight over the last umbrella at a bus stop, then find out they're neighbours.";
    const storyHooks = [
      {
        id: id('story-hook-1'),
        type: HookType.COLD_OPEN,
        text: "Excuse me, akin 'to.",
        openingShot:
          'Two hands grab the same umbrella off the last hook at a rainy bus stop.',
        reportedClaims: [],
      },
      {
        id: id('story-hook-2'),
        type: HookType.QUESTION,
        text: "Sino'ng mas deserving sa huling payong?",
        openingShot: 'Ana and Ben stare at the last umbrella on the hook.',
        reportedClaims: [],
      },
      {
        id: id('story-hook-3'),
        type: HookType.MYSTERY,
        text: 'Hindi pa nila alam, magkapitbahay pala sila.',
        openingShot: 'Rain pours on an empty bus stop as two people run in.',
        reportedClaims: [],
      },
    ];
    const busStop = (
      inFrame: ShotSubject,
      framing: ShotFraming,
      props: string,
      setting = 'Bus stop at night, heavy rain',
    ) => ({ inFrame, framing, setting, props });

    await versions.create({
      id: id('story-v1'),
      ...scope,
      projectId: storyId,
      number: 1,
      status: 'APPROVED',
      origin: { kind: ScriptOriginKind.WRITTEN, fromNumber: null },
      // An own premise has no title (§3.23 Writes).
      angleTitle: null,
      language: ScriptLanguage.TAGLISH,
      lengthSeconds: 45,
      contentStyle: ContentStyle.SKIT,
      studio: StudioType.ENTERTAINMENT,
      hooks: storyHooks,
      selectedHookId: storyHooks[0].id,
      scenes: [
        {
          id: id('story-scene-1'),
          order: 1,
          purpose: ScenePurpose.HOOK,
          durationSeconds: 7,
          narration: '',
          lines: [
            {
              speaker: 'Ana',
              text: "Excuse me, akin 'to.",
              shot: 'close-up on both hands on the handle',
              reaction: 'grips the umbrella tighter',
              pauseSeconds: 0,
              delivery: 'polite but firm',
            },
            {
              speaker: 'Ben',
              text: "Ako'ng nauna, Miss.",
              shot: 'two-shot, both still holding on',
              reaction: 'raises an eyebrow',
              pauseSeconds: 0.5,
              delivery: 'deadpan',
            },
          ],
          sound: 'Heavy rain drumming on the bus stop roof',
          onScreenText: 'Isang payong. Dalawang tao.',
          visual:
            'Ana and Ben grab the same umbrella off the last hook and freeze mid-pull.',
          transitionIn: SceneTransition.CUT,
          direction: busStop(
            ShotSubject.CREATOR,
            ShotFraming.MEDIUM,
            'Umbrella',
          ),
          cta: null,
          factIds: [],
          reportedClaims: [],
        },
        {
          id: id('story-scene-2'),
          order: 2,
          purpose: ScenePurpose.SETUP,
          durationSeconds: 8,
          narration: '',
          lines: [
            {
              speaker: 'Ana',
              text: 'Galing ako sa 12-hour shift. Kailangan ko talaga ’to.',
              shot: 'medium on Ana',
              reaction: 'hugs the umbrella to her chest',
              pauseSeconds: 0.5,
              delivery: 'tired, pleading',
            },
            {
              speaker: 'Ben',
              text: 'May delivery pa ako. Basa na nga helmet ko oh.',
              shot: 'medium on Ben',
              reaction: 'lifts his dripping helmet',
              pauseSeconds: 0,
              delivery: 'exasperated',
            },
          ],
          sound: 'Rain dripping from the roof edge',
          onScreenText: '',
          visual:
            'Ana in her yellow raincoat hugs the umbrella; Ben holds up his soaked helmet.',
          transitionIn: SceneTransition.CUT,
          direction: busStop(
            ShotSubject.CREATOR,
            ShotFraming.MEDIUM,
            'Umbrella, Helmet',
          ),
          cta: null,
          factIds: [],
          reportedClaims: [],
        },
        {
          id: id('story-scene-3'),
          order: 3,
          purpose: ScenePurpose.BUILD,
          durationSeconds: 10,
          narration: '',
          lines: [
            {
              speaker: 'Ben',
              text: 'Sige, hati tayo. Ako sa hawakan.',
              shot: 'wide, both tugging',
              reaction: 'tugs the umbrella back',
              pauseSeconds: 0,
              delivery: 'smug',
            },
            {
              speaker: 'Ana',
              text: 'E di ikaw sa ulan.',
              shot: 'close-up on Ana',
              reaction: 'the umbrella pops open and splashes them both',
              pauseSeconds: 1,
              delivery: 'dry',
            },
          ],
          sound: 'The umbrella snapping open and a splash',
          onScreenText: '',
          visual:
            'A tug-of-war over the umbrella until it pops open between them and splashes them both.',
          transitionIn: SceneTransition.CUT,
          direction: busStop(ShotSubject.CREATOR, ShotFraming.WIDE, 'Umbrella'),
          cta: null,
          factIds: [],
          reportedClaims: [],
        },
        {
          id: id('story-scene-4'),
          order: 4,
          purpose: ScenePurpose.TURN,
          durationSeconds: 9,
          narration: '',
          lines: [
            {
              speaker: 'Ana',
              text: 'Mabini Residences ka rin?',
              shot: 'insert on both phone screens',
              reaction: 'both phones buzz with the same address',
              pauseSeconds: 1,
              delivery: 'surprised',
            },
            {
              speaker: 'Ben',
              text: 'Oo, bagong lipat lang ako.',
              shot: 'two-shot',
              reaction: 'looks up from his phone',
              pauseSeconds: 0,
              delivery: 'slowly, suspicious',
            },
          ],
          sound: 'Two phones buzzing at once',
          onScreenText: 'Parehong address?',
          visual:
            'Their phones buzz at the same moment; both screens show the same building, Mabini Residences.',
          transitionIn: SceneTransition.CUT,
          direction: busStop(
            ShotSubject.CREATOR,
            ShotFraming.CLOSE_UP,
            'Phones',
          ),
          cta: null,
          factIds: [],
          reportedClaims: [],
        },
        {
          id: id('story-scene-5'),
          order: 5,
          // The Cliffhanger (R29): the reveal lands, then a question stays open.
          purpose: ScenePurpose.PAYOFF,
          durationSeconds: 11,
          narration: '',
          lines: [
            {
              speaker: 'Ana',
              text: "Ako 'yung 4B. Katapat mo lang pala ako.",
              shot: 'two-shot under one umbrella',
              reaction: 'smiles and shares the umbrella',
              pauseSeconds: 0.5,
              delivery: 'amused',
            },
            {
              speaker: 'Ben',
              text: "Teka… ikaw pala ang 4B? E sino'ng nag-iiwan ng sulat sa pinto ko?",
              shot: 'slow push-in on Ben',
              reaction: 'stops walking and slowly turns to her',
              pauseSeconds: 1.5,
              delivery: 'half whisper, suspicious',
            },
          ],
          sound: 'Rain easing off, footsteps stopping',
          onScreenText: "Sino'ng nag-iiwan ng sulat?",
          visual:
            'Sharing one umbrella at the building gate, Ben stops and stares at Ana, the question hanging as the rain keeps falling.',
          transitionIn: SceneTransition.CUT,
          direction: busStop(
            ShotSubject.CREATOR,
            ShotFraming.CLOSE_UP,
            'Umbrella',
            'Apartment gate at night, light rain',
          ),
          cta: null,
          factIds: [],
          reportedClaims: [],
        },
      ],
      shoot: {
        scenario:
          'Two strangers at a rainy bus stop fight over the last umbrella, then walk home to the same building.',
        presenter: castLine(storyCast),
      },
      caption:
        "Isang payong, dalawang tao, isang building. Sino'ng nag-iiwan ng sulat sa 4B? #comedy #taglish",
      approvedAt: ago(4 * HOUR),
      approvedFactSnapshot: [],
      createdAt: ago(5 * HOUR),
      updatedAt: ago(4 * HOUR),
    });
    await projects.create(
      project({
        id: storyId,
        studioType: StudioType.ENTERTAINMENT,
        title: 'The Umbrella Standoff',
        status: ProjectStatus.SCRIPT_REVIEW,
        updatedAt: ago(4 * HOUR),
        story: {
          genre: StoryGenre.COMEDY,
          detail: 'Two strangers reach for the same umbrella.',
          premise: {
            kind: PremiseKind.OWN,
            suggestionId: null,
            title: '',
            logline: storyPremise,
          },
          cast: storyCast,
          storytelling: Storytelling.ACTED,
          language: ScriptLanguage.TAGLISH,
          lengthSeconds: 45,
        },
        premiseSuggestionSet: null,
        scriptSummary: {
          versionCount: 1,
          latestNumber: 1,
          latestIsDraft: false,
          approved: [{ versionId: id('story-v1'), number: 1, usedFacts: [] }],
        },
      }),
    );

    // Untitled story: a draft with no genre yet.
    await projects.create(
      project({
        id: storyDraftId,
        studioType: StudioType.ENTERTAINMENT,
        title: 'Untitled story',
        status: ProjectStatus.DRAFT,
        updatedAt: ago(6 * DAY),
        story: { ...DEFAULT_STORY, cast: [] },
        premiseSuggestionSet: null,
      }),
    );

    const [projectCount, videoEditCount] = await Promise.all([
      projects.count({ id: { in: projectIds } }),
      videoEdits.count({ projectId: { in: projectIds } }),
    ]);

    console.log('\n--- Demo data ---');
    console.log('  Owner:     Mika Reyes (configured Google account)');
    console.log(
      `  Projects:  ${projectCount} (blender, lamp, neck fan, bottle, untitled, umbrella story, untitled story)`,
    );
    console.log(`  Video edits: ${videoEditCount} (blender text cards)`);
    console.log('  Credits:   128');
    console.log('  Sign in with that Google account to see them.\n');
  } finally {
    await app.close();
  }
}

void bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
