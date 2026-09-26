import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import type { OwnerContext } from 'src/common/types/owner-context';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import {
  ClaimFlagCategory,
  GenerationJobType,
  ProjectStatus,
  ScenePurpose,
  SceneTransition,
  ScriptCopyReason,
  ScriptOriginKind,
  ScriptVersionStatus,
  ShotFraming,
  ShotSubject,
  type ClaimFlag,
  type CopyScriptVersionInput,
  type SceneDirectionInput,
  type SceneLineInput,
  type ShootPlanInput,
  type ScriptVersion,
  type UpdateScriptVersionInput,
} from 'src/graphql/generated/graphql';
import { TOKENS } from 'src/types/tokens';
import {
  ClaimCheckService,
  normalizeClaim,
} from '../facts/claim-check.service';
import { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import {
  isApprovalCurrent,
  latestApproval,
  ProjectsService,
  readEpisode,
  readStory,
} from '../projects/projects.service';
import type {
  FactSnapshot,
  ProjectRecord,
} from '../projects/repositories/projects.repository';
import { studioFor, studioOf } from '../studios/studios';
import { scriptStudioFor, versionStudio } from './script-studios';
import {
  fitDuration,
  hookScene,
  isSkit,
  LIMITS,
  linePauses,
  readLine,
  snapPause,
  spokenSeconds,
  spokenText,
  type StoryContinuity,
  type WritingContext,
} from './script-writing';
import type {
  SceneDirectionRecord,
  SceneLineRecord,
  ScriptHookRecord,
  ScriptSceneRecord,
  ScriptsRepository,
  ScriptVersionRecord,
  ShootPlanRecord,
} from './repositories/scripts.repository';

export const WRITE_SCRIPT_COST = 3;
export const WRITE_SCRIPT_STEPS = 3;
export const REWRITE_COST = 1;
export const REWRITE_STEPS = 2;

/** Version history is bounded; the list query returns at most this many. */
const MAX_VERSIONS = 50;
const ID_PATTERN = /^[a-f0-9]{24}$/;

export interface VersionFlags {
  hooks: Map<string, ClaimFlag[]>;
  scenes: Map<string, ClaimFlag[]>;
  caption: ClaimFlag[];
}

@Injectable()
export class ScriptsService {
  constructor(
    @Inject(TOKENS.SCRIPTS_REPOSITORY)
    private readonly versions: ScriptsRepository,
    private readonly projectsService: ProjectsService,
    private readonly jobsService: GenerationJobsService,
    private readonly claimCheck: ClaimCheckService,
  ) {}

  // ── Reads ────────────────────────────────────────────────────────────────

  async list(projectId: string, owner: OwnerContext): Promise<ScriptVersion[]> {
    const project = await this.projectsService.getRecord(projectId, owner);
    const records = await this.records(projectId, owner);

    return records.map((record) => this.toGraphql(record, project));
  }

  async records(
    projectId: string,
    owner: OwnerContext,
  ): Promise<ScriptVersionRecord[]> {
    const page = await this.versions
      .list(
        applyTenantFilter<ScriptVersionRecord>(
          { projectId, ownerId: owner.ownerId },
          owner.organizationId,
        ),
        { sort: { number: 'DESC' } },
      )
      .connection({ first: MAX_VERSIONS });

    return page.edges.map(({ node }) => node);
  }

  /**
   * Approved versions whose approval is still current (no fact they used has
   * changed since), newest first.
   */
  async currentApproved(
    project: ProjectRecord,
    owner: OwnerContext,
  ): Promise<ScriptVersionRecord[]> {
    const records = await this.records(project.id, owner);

    return records.filter(
      (record) =>
        this.effectiveStatus(record, project.approvedFacts) ===
        ScriptVersionStatus.APPROVED,
    );
  }

  async getRecord(
    id: string,
    owner: OwnerContext,
  ): Promise<ScriptVersionRecord> {
    if (!ID_PATTERN.test(id)) {
      throw new NotFoundError('We can’t find that version.');
    }

    const [record] = await this.versions
      .list(
        applyTenantFilter<ScriptVersionRecord>(
          { id, ownerId: owner.ownerId },
          owner.organizationId,
        ),
      )
      .collect();

    if (!record) throw new NotFoundError('We can’t find that version.');

    return record;
  }

  /**
   * The writing context for jobs, from the project's intake: product,
   * approved facts and strategy, or the story, as the project's studio reads it.
   */
  writingContext(project: ProjectRecord): WritingContext {
    return scriptStudioFor(project).scripts.context(project);
  }

  /**
   * What an episode 2+ is written from (§3.25): the series premise, a recap
   * of each episode before the previous one (its last scene when no recap
   * was saved), and the previous episode's newest approved version in full.
   * Null for Episode 1, a lone story and other studios, so their prompts are
   * unchanged.
   */
  async continuity(
    project: ProjectRecord,
    owner: OwnerContext,
  ): Promise<StoryContinuity | null> {
    const episodeNumber = project.episodeNumber ?? 1;

    if (!project.seriesId || episodeNumber < 2) return null;

    const episodes = await this.projectsService.seriesRecords(project, owner);
    const previous = episodes.find(
      (item) => (item.episodeNumber ?? 1) === episodeNumber - 1,
    );
    const approval = previous ? latestApproval(previous) : null;

    if (!previous || !approval) return null;

    const version = (await this.records(previous.id, owner)).find(
      (record) => record.id === approval.versionId,
    );

    if (!version) return null;

    const first = episodes.find((item) => (item.episodeNumber ?? 1) === 1);

    return {
      episodeNumber,
      seriesPremise: first ? (readStory(first).premise?.logline ?? '') : '',
      earlier: episodes
        .filter((item) => (item.episodeNumber ?? 1) < episodeNumber - 1)
        .map((item) => ({
          episodeNumber: item.episodeNumber ?? 1,
          recap:
            readEpisode(item).recap ?? latestApproval(item)?.lastScene ?? '',
        })),
      previous: {
        projectId: previous.id,
        episodeNumber: previous.episodeNumber ?? 1,
        versionNumber: version.number,
        scenes: [...version.scenes]
          .sort((a, b) => a.order - b.order)
          .map((scene) => ({
            purpose: scene.purpose,
            narration: scene.narration,
            lines: (scene.lines ?? []).map(({ speaker, text }) => ({
              speaker,
              text,
            })),
          })),
      },
    };
  }

  /** Re-syncs the project's script summary (the next episode reads its last scene). */
  async resync(projectId: string, owner: OwnerContext): Promise<void> {
    await this.syncProject(projectId, owner);
  }

  // ── Paid jobs ────────────────────────────────────────────────────────────

  async writeScript(
    owner: OwnerContext,
    projectId: string,
    idempotencyKey: string,
  ): Promise<GenerationJobRecord> {
    const project = await this.projectsService.getRecord(projectId, owner);

    // The studio's write gate: what its prompt needs from the intake.
    scriptStudioFor(project).scripts.assertReady(project);

    const job = await this.jobsService.create({
      owner,
      projectId: project.id,
      projectTitle: project.title,
      type: GenerationJobType.WRITE_SCRIPT,
      label: 'Write hooks & script',
      stepCount: WRITE_SCRIPT_STEPS,
      creditCost: WRITE_SCRIPT_COST,
      idempotencyKey,
    });

    if (
      project.status === ProjectStatus.DRAFT ||
      project.status === ProjectStatus.FACTS_REVIEW
    ) {
      await this.projectsService.setStatus(
        project.id,
        owner,
        ProjectStatus.SCRIPT_REVIEW,
      );
    }

    return job;
  }

  async rewrite(
    owner: OwnerContext,
    target: { versionId: string; hookId?: string; sceneId?: string },
    idempotencyKey: string,
  ): Promise<GenerationJobRecord> {
    const version = await this.getRecord(target.versionId, owner);

    if (version.status !== 'DRAFT') {
      throw new ConflictError(
        'Approved versions can’t change. Edit it as a new version.',
      );
    }

    const exists = target.hookId
      ? version.hooks.some((hook) => hook.id === target.hookId)
      : version.scenes.some((scene) => scene.id === target.sceneId);

    if (!exists) {
      throw new NotFoundError('We can’t find that part of the script.');
    }

    const project = await this.projectsService.getRecord(
      version.projectId,
      owner,
    );

    return this.jobsService.create({
      owner,
      projectId: project.id,
      projectTitle: project.title,
      type: target.hookId
        ? GenerationJobType.REWRITE_HOOK
        : GenerationJobType.REWRITE_SCENE,
      label: target.hookId ? 'Rewrite hook' : 'Rewrite scene',
      stepCount: REWRITE_STEPS,
      creditCost: REWRITE_COST,
      input: {
        versionId: version.id,
        hookId: target.hookId ?? null,
        sceneId: target.sceneId ?? null,
      },
      idempotencyKey,
    });
  }

  // ── Version writes ───────────────────────────────────────────────────────

  /** Stores a new draft written by a job, and returns its id. */
  async createWrittenVersion(
    project: ProjectRecord,
    owner: OwnerContext,
    content: Pick<
      ScriptVersionRecord,
      'contentStyle' | 'hooks' | 'scenes' | 'shoot' | 'caption'
    >,
  ): Promise<string> {
    const record = await this.insert(project, owner, {
      origin: { kind: ScriptOriginKind.WRITTEN, fromNumber: null },
      ...scriptStudioFor(project).scripts.source(project),
      selectedHookId: null,
      ...content,
    });

    return record.id;
  }

  /** Replaces one hook or scene after a rewrite job; drafts only. */
  async replaceItem(
    versionId: string,
    owner: OwnerContext,
    item: { hook?: ScriptHookRecord; scene?: ScriptSceneRecord },
  ): Promise<void> {
    const version = await this.getRecord(versionId, owner);

    if (version.status !== 'DRAFT') {
      throw new ConflictError('This version was approved while rewriting.');
    }

    const hooks = item.hook
      ? version.hooks.map((hook) =>
          hook.id === item.hook?.id ? item.hook : hook,
        )
      : version.hooks;
    const scenes = item.scene
      ? version.scenes.map((scene) =>
          scene.id === item.scene?.id ? item.scene : scene,
        )
      : version.scenes;
    const chosen = hooks.find((hook) => hook.id === version.selectedHookId);
    const target = hookScene(scenes);
    // A rewritten chosen hook moves into scene 1; a rewritten scene 1 keeps
    // the chosen hook's words and its own new visual.
    const parts =
      item.hook && item.hook.id === chosen?.id
        ? { words: true, visual: true }
        : item.scene && item.scene.id === target?.id
          ? { words: true, visual: false }
          : null;

    await this.patch(version, owner, {
      hooks,
      scenes:
        chosen && target && parts
          ? scenes.map((scene) =>
              scene.id === target.id
                ? openWithHook(
                    scene,
                    chosen,
                    isSkit(version.contentStyle),
                    parts,
                  )
                : scene,
            )
          : scenes,
    });
  }

  /**
   * Autosave for a draft. Items being rewritten by a running job are left
   * alone, so a rewrite can't be overwritten by an edit made before it landed.
   */
  async update(
    owner: OwnerContext,
    input: UpdateScriptVersionInput,
  ): Promise<ScriptVersion> {
    const version = await this.getRecord(input.id, owner);

    if (version.status !== 'DRAFT') {
      throw new ConflictError(
        'Approved versions can’t change. Edit it as a new version.',
      );
    }

    const busy = await this.busyItems(version, owner);
    const changes: Partial<ScriptVersionRecord> = {};

    if (input.selectedHookId !== undefined) {
      if (
        input.selectedHookId !== null &&
        !version.hooks.some((hook) => hook.id === input.selectedHookId)
      ) {
        throw new ValidationError('Pick one of this version’s hooks.', {
          field: 'input.selectedHookId',
        });
      }
      changes.selectedHookId = input.selectedHookId;
    }

    if (input.hooks) {
      const edits = new Map(input.hooks.map((hook) => [hook.id, hook]));
      changes.hooks = version.hooks.map((hook) => {
        const edit = edits.get(hook.id);
        if (!edit || busy.has(hook.id)) return hook;

        const text =
          edit.text === undefined || edit.text === null
            ? hook.text
            : limit(edit.text, LIMITS.hookText, 'input.hooks.text');

        return {
          ...hook,
          text,
          openingShot:
            edit.openingShot === undefined || edit.openingShot === null
              ? hook.openingShot
              : limit(
                  edit.openingShot,
                  LIMITS.openingShot,
                  'input.hooks.openingShot',
                ),
          reportedClaims: keepPresentClaims(hook.reportedClaims, text),
        };
      });
    }

    if (input.scenes) {
      const edits = new Map(input.scenes.map((scene) => [scene.id, scene]));
      changes.scenes = version.scenes.map((scene) => {
        const edit = edits.get(scene.id);
        if (!edit || busy.has(scene.id)) return scene;

        if (
          edit.durationSeconds !== undefined &&
          edit.durationSeconds !== null &&
          (edit.durationSeconds < LIMITS.minDuration ||
            edit.durationSeconds > LIMITS.maxDuration)
        ) {
          throw new ValidationError('Use 2 to 15 seconds.', {
            field: 'input.scenes.durationSeconds',
          });
        }

        const narration =
          edit.narration === undefined || edit.narration === null
            ? scene.narration
            : limit(edit.narration, LIMITS.narration, 'input.scenes.narration');
        const lines =
          edit.lines === undefined || edit.lines === null
            ? (scene.lines ?? [])
            : editLines(edit.lines);
        const sound =
          edit.sound === undefined || edit.sound === null
            ? (scene.sound ?? null)
            : limit(edit.sound, LIMITS.sound, 'input.scenes.sound') || null;
        const spoken = spokenText({ narration, lines });

        return {
          ...scene,
          durationSeconds: fitDuration(
            edit.durationSeconds === undefined || edit.durationSeconds === null
              ? scene.durationSeconds
              : edit.durationSeconds,
            spoken,
            linePauses({ lines }),
          ),
          narration,
          // Narrated scenes stay without skit fields unless given some.
          ...(lines.length || scene.lines ? { lines } : {}),
          ...(sound || scene.sound !== undefined ? { sound } : {}),
          onScreenText:
            edit.onScreenText === undefined || edit.onScreenText === null
              ? scene.onScreenText
              : limit(
                  edit.onScreenText,
                  LIMITS.onScreenText,
                  'input.scenes.onScreenText',
                ),
          visual:
            edit.visual === undefined || edit.visual === null
              ? scene.visual
              : limit(edit.visual, LIMITS.visual, 'input.scenes.visual'),
          direction: editDirection(scene.direction ?? null, edit.direction),
          transitionIn:
            edit.transitionIn === undefined || edit.transitionIn === null
              ? scene.transitionIn
              : edit.transitionIn,
          cta:
            scene.purpose !== ScenePurpose.CALL_TO_ACTION ||
            edit.cta === undefined
              ? scene.cta
              : edit.cta === null
                ? null
                : limit(edit.cta, LIMITS.cta, 'input.scenes.cta') || null,
          reportedClaims: keepPresentClaims(scene.reportedClaims, spoken),
        };
      });
    }

    this.applyChosenHook(version, input, changes, busy);

    if (input.shoot) {
      changes.shoot = editShoot(version.shoot ?? null, input.shoot);
    }

    if (input.caption !== undefined && input.caption !== null) {
      changes.caption = limit(input.caption, LIMITS.caption, 'input.caption');
    }

    const updated = await this.patch(version, owner, changes);
    const project = await this.projectsService.getRecord(
      version.projectId,
      owner,
    );

    return this.toGraphql(updated, project);
  }

  /**
   * Scene 1 plays the chosen hook. Picking a hook puts its words and opening
   * shot there, and editing the chosen hook's text or opening shot moves that
   * part. The editor sends scene 1 with the hook already in it, so a save that
   * edits scene 1's words or visual is left as sent; a scene being rewritten
   * is left alone, and its rewrite keeps the hook (`replaceItem`).
   */
  private applyChosenHook(
    version: ScriptVersionRecord,
    input: UpdateScriptVersionInput,
    changes: Partial<ScriptVersionRecord>,
    busy: Set<string>,
  ): void {
    const hookId =
      changes.selectedHookId !== undefined
        ? changes.selectedHookId
        : version.selectedHookId;
    const hook = (changes.hooks ?? version.hooks).find(
      (item) => item.id === hookId,
    );
    const before = version.hooks.find((item) => item.id === hookId);
    const scenes = changes.scenes ?? version.scenes;
    const target = hookScene(scenes);

    if (!hook || !target || busy.has(target.id)) return;

    const picked = hookId !== version.selectedHookId;
    const parts = {
      words: picked || hook.text !== before?.text,
      visual: picked || hook.openingShot !== before?.openingShot,
    };
    const sent = input.scenes?.find((scene) => scene.id === target.id);

    if (
      (!parts.words && !parts.visual) ||
      (sent &&
        (sent.narration != null || sent.lines != null || sent.visual != null))
    ) {
      return;
    }

    changes.scenes = scenes.map((scene) =>
      scene.id === target.id
        ? openWithHook(scene, hook, isSkit(version.contentStyle), parts)
        : scene,
    );
  }

  /**
   * Approves a version after re-checking it on the server: a hook is picked,
   * no line in the picked hook, scenes or caption is flagged (a studio without
   * the claim check has no flags), and no job is writing it. Re-approving a
   * version that needs review refreshes the facts it is approved against.
   */
  async approve(id: string, owner: OwnerContext): Promise<ScriptVersion> {
    const version = await this.getRecord(id, owner);
    const project = await this.projectsService.getRecord(
      version.projectId,
      owner,
    );

    if (!version.selectedHookId) {
      throw new ConflictError('Pick a hook first.', { code: 'NO_HOOK' });
    }

    if ((await this.busyItems(version, owner)).size > 0) {
      throw new ConflictError('Wait for the rewrite to finish.', {
        code: 'REWRITE_RUNNING',
      });
    }

    const flags = this.flagsFor(version, project.approvedFacts);
    const flagged =
      (flags.hooks.get(version.selectedHookId)?.length ?? 0) +
      [...flags.scenes.values()].reduce((sum, list) => sum + list.length, 0) +
      flags.caption.length;

    if (flagged > 0) {
      throw new ConflictError(
        flagged === 1
          ? 'Fix 1 flagged line first.'
          : `Fix ${flagged} flagged lines first.`,
        { code: 'FLAGGED_LINES' },
      );
    }

    const approvedFacts = new Map(
      project.approvedFacts.map((fact) => [fact.id, fact.text]),
    );
    const snapshot: FactSnapshot[] = [
      ...new Set(version.scenes.flatMap((scene) => scene.factIds)),
    ]
      .filter((factId) => approvedFacts.has(factId))
      .map((factId) => ({ id: factId, text: approvedFacts.get(factId) ?? '' }));

    // A draft reads with fitted scene lengths; approval stores what was shown.
    const updated = await this.patch(version, owner, {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedFactSnapshot: snapshot,
      ...(version.status === 'DRAFT'
        ? { scenes: fitSceneLengths(version.scenes) }
        : {}),
    });

    await this.syncProject(version.projectId, owner);

    return this.toGraphql(
      updated,
      await this.projectsService.getRecord(version.projectId, owner),
    );
  }

  /** Restore an older version, or edit an approved one, as a new draft. */
  async copy(
    owner: OwnerContext,
    input: CopyScriptVersionInput,
  ): Promise<ScriptVersion> {
    const source = await this.getRecord(input.id, owner);
    const project = await this.projectsService.getRecord(
      source.projectId,
      owner,
    );
    const record = await this.insert(project, owner, {
      origin: {
        kind:
          input.reason === ScriptCopyReason.RESTORE
            ? ScriptOriginKind.RESTORED
            : ScriptOriginKind.EDITED,
        fromNumber: source.number,
      },
      angleTitle: source.angleTitle,
      language: source.language,
      lengthSeconds: source.lengthSeconds,
      contentStyle: source.contentStyle ?? null,
      studio: studioOf(source.studio),
      endsSeries: source.endsSeries ?? null,
      hooks: source.hooks,
      selectedHookId: source.selectedHookId,
      scenes: source.scenes,
      shoot: source.shoot ?? null,
      caption: source.caption,
    });

    return this.toGraphql(
      record,
      await this.projectsService.getRecord(project.id, owner),
    );
  }

  /**
   * Copies the current approved version into a duplicated project as draft
   * v1, remapping fact ids to the copied facts.
   */
  async copyApprovedToProject(
    sourceProjectId: string,
    target: ProjectRecord,
    owner: OwnerContext,
    factIdMap: Map<string, string>,
  ): Promise<void> {
    const source = await this.projectsService.getRecord(sourceProjectId, owner);
    const approved = (await this.records(sourceProjectId, owner)).find(
      (record) =>
        record.status === 'APPROVED' &&
        isApprovalCurrent(record.approvedFactSnapshot, source.approvedFacts),
    );

    if (!approved) return;

    await this.insert(target, owner, {
      origin: { kind: ScriptOriginKind.COPIED, fromNumber: approved.number },
      angleTitle: approved.angleTitle,
      language: approved.language,
      lengthSeconds: approved.lengthSeconds,
      contentStyle: approved.contentStyle ?? null,
      studio: studioOf(approved.studio),
      hooks: approved.hooks,
      selectedHookId: approved.selectedHookId,
      scenes: approved.scenes.map((scene) => ({
        ...scene,
        factIds: scene.factIds.flatMap((factId) => {
          const mapped = factIdMap.get(factId);
          return mapped ? [mapped] : [];
        }),
      })),
      shoot: approved.shoot ?? null,
      caption: approved.caption,
    });
  }

  // ── Flags and mapping ────────────────────────────────────────────────────

  /**
   * Flags are derived on read from the current wording and approved facts, so
   * approving a fact the creator added resolves the line automatically. A
   * studio without the claim check (a story has no facts) never has flags.
   */
  flagsFor(
    version: Pick<ScriptVersionRecord, 'hooks' | 'scenes' | 'caption'> &
      Partial<Pick<ScriptVersionRecord, 'studio'>>,
    approvedFacts: FactSnapshot[],
  ): VersionFlags {
    if (!versionStudio(version).definition.claimCheck) {
      return {
        hooks: new Map(version.hooks.map((hook) => [hook.id, []])),
        scenes: new Map(version.scenes.map((scene) => [scene.id, []])),
        caption: [],
      };
    }

    const texts = approvedFacts.map((fact) => fact.text);
    const lineFlags = (lines: string[], claims: string[]) =>
      dedupe([
        ...lines.flatMap((line) => this.claimCheck.checkText(line, texts)),
        ...this.claimCheck.checkClaimsAgainstFacts(claims, texts),
      ]);

    return {
      hooks: new Map(
        version.hooks.map((hook) => [
          hook.id,
          lineFlags([hook.text], hook.reportedClaims),
        ]),
      ),
      scenes: new Map(
        version.scenes.map((scene) => [
          scene.id,
          lineFlags(
            [
              scene.narration,
              // Viewers hear a skit's lines, so each is checked like narration.
              ...(scene.lines ?? []).map((line) => line.text),
              scene.onScreenText,
              scene.cta ?? '',
            ],
            scene.reportedClaims,
          ),
        ]),
      ),
      caption: lineFlags([version.caption], []),
    };
  }

  effectiveStatus(
    record: ScriptVersionRecord,
    approvedFacts: FactSnapshot[],
  ): ScriptVersionStatus {
    if (record.status === 'DRAFT') return ScriptVersionStatus.DRAFT;

    return isApprovalCurrent(record.approvedFactSnapshot, approvedFacts)
      ? ScriptVersionStatus.APPROVED
      : ScriptVersionStatus.NEEDS_REVIEW;
  }

  toGraphql(
    record: ScriptVersionRecord,
    project: ProjectRecord,
  ): ScriptVersion {
    const flags = this.flagsFor(record, project.approvedFacts);
    // Drafts written before scene lengths followed narration read fitted;
    // approved versions never change, so they read as stored (as the video does).
    const scenes =
      record.status === 'DRAFT'
        ? fitSceneLengths(record.scenes)
        : record.scenes;

    return {
      id: record.id,
      projectId: record.projectId,
      number: record.number,
      status: this.effectiveStatus(record, project.approvedFacts),
      origin: record.origin,
      angleTitle: record.angleTitle,
      language: record.language,
      lengthSeconds: record.lengthSeconds,
      contentStyle: record.contentStyle ?? null,
      studio: studioOf(record.studio),
      endsSeries: record.endsSeries ?? false,
      hooks: record.hooks.map((hook) => ({
        id: hook.id,
        type: hook.type,
        text: hook.text,
        openingShot: hook.openingShot,
        flags: flags.hooks.get(hook.id) ?? [],
      })),
      selectedHookId: record.selectedHookId,
      scenes: [...scenes]
        .sort((a, b) => a.order - b.order)
        .map((scene) => ({
          id: scene.id,
          order: scene.order,
          purpose: scene.purpose,
          durationSeconds: scene.durationSeconds,
          narration: scene.narration,
          lines: (scene.lines ?? []).map(readLine),
          sound: scene.sound ?? null,
          onScreenText: scene.onScreenText,
          visual: scene.visual,
          direction: scene.direction ?? null,
          transitionIn: scene.transitionIn ?? SceneTransition.CUT,
          cta: scene.cta,
          factIds: scene.factIds,
          flags: flags.scenes.get(scene.id) ?? [],
        })),
      shoot: record.shoot ?? null,
      caption: record.caption,
      captionFlags: flags.caption,
      spokenSeconds: spokenSeconds(record.scenes.map(spokenText)),
      totalSeconds: scenes.reduce(
        (sum, scene) => sum + scene.durationSeconds,
        0,
      ),
      usedFactIds: [
        ...new Set(record.scenes.flatMap((scene) => scene.factIds)),
      ],
      createdAt: record.createdAt,
      approvedAt: record.approvedAt,
    };
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async insert(
    project: ProjectRecord,
    owner: OwnerContext,
    values: Pick<
      ScriptVersionRecord,
      | 'origin'
      | 'angleTitle'
      | 'language'
      | 'lengthSeconds'
      | 'contentStyle'
      | 'studio'
      | 'hooks'
      | 'selectedHookId'
      | 'scenes'
      | 'shoot'
      | 'caption'
    > &
      Partial<Pick<ScriptVersionRecord, 'endsSeries'>>,
  ): Promise<ScriptVersionRecord> {
    const [latest] = await this.records(project.id, owner);

    if ((latest?.number ?? 0) >= MAX_VERSIONS * 4) {
      throw new ConflictError('This project has too many versions.');
    }

    const now = new Date();
    const record = await this.versions.create({
      id: new Types.ObjectId().toHexString(),
      ownerId: owner.ownerId,
      organizationId: owner.organizationId,
      projectId: project.id,
      number: (latest?.number ?? 0) + 1,
      status: 'DRAFT',
      approvedAt: null,
      approvedFactSnapshot: [],
      createdAt: now,
      updatedAt: now,
      // Every version records its studio; copies pass their source's.
      studio: studioFor(project).type,
      ...values,
    });

    await this.syncProject(project.id, owner);

    return record;
  }

  private async patch(
    version: ScriptVersionRecord,
    owner: OwnerContext,
    changes: Partial<ScriptVersionRecord>,
  ): Promise<ScriptVersionRecord> {
    const next = { ...changes, updatedAt: new Date() };

    await this.versions.updateOne(
      applyTenantFilter<ScriptVersionRecord>(
        { id: version.id, ownerId: owner.ownerId },
        owner.organizationId,
      ),
      next,
    );
    await this.projectsService.syncScripts(
      version.projectId,
      owner,
      await this.summary(version.projectId, owner),
    );

    return { ...version, ...next };
  }

  private async busyItems(
    version: ScriptVersionRecord,
    owner: OwnerContext,
  ): Promise<Set<string>> {
    const active = await this.jobsService.listForProject(
      version.projectId,
      owner,
      true,
    );

    return new Set(
      active
        .filter((job) => job.input.versionId === version.id)
        .flatMap((job) => [job.input.hookId, job.input.sceneId])
        .filter((itemId): itemId is string => Boolean(itemId)),
    );
  }

  private async summary(projectId: string, owner: OwnerContext) {
    const records = await this.records(projectId, owner);
    const latest = records[0];

    return {
      versionCount: records.length,
      latestNumber: latest?.number ?? 0,
      latestIsDraft: latest?.status === 'DRAFT',
      approved: records
        .filter((record) => record.status === 'APPROVED')
        .map((record) => ({
          versionId: record.id,
          number: record.number,
          usedFacts: record.approvedFactSnapshot,
          lastScene: lastSceneText(record.scenes),
        })),
    };
  }

  private async syncProject(projectId: string, owner: OwnerContext) {
    await this.projectsService.syncScripts(
      projectId,
      owner,
      await this.summary(projectId, owner),
    );
  }
}

/**
 * A version's last scene as the next episode reads it (§3.25): its lines as
 * `Name: line`, one per line, or its narration.
 */
export function lastSceneText(scenes: ScriptSceneRecord[]): string {
  const last = [...scenes].sort((a, b) => b.order - a.order)[0];

  if (!last) return '';

  const lines = (last.lines ?? [])
    .filter((line) => line.text.trim())
    .map((line) =>
      line.speaker.trim() ? `${line.speaker.trim()}: ${line.text.trim()}` : line.text.trim(),
    );

  return lines.length > 0 ? lines.join('\n') : last.narration.trim();
}

/**
 * Scene 1 opening with the chosen hook: with `words`, its narration is the
 * hook's text, or in a skit its first line says it (keeping that line's
 * speaker and beat; a line is added when it has none); with `visual`, the
 * hook's opening shot becomes its visual. The scene grows to fit, and keeps
 * the claims, its own and the hook's, that are still in its words.
 */
function openWithHook(
  scene: ScriptSceneRecord,
  hook: ScriptHookRecord,
  skit: boolean,
  parts: { words: boolean; visual: boolean },
): ScriptSceneRecord {
  const current = scene.lines ?? [];
  const narration = parts.words && !skit ? hook.text : scene.narration;
  const lines =
    parts.words && skit
      ? current.length
        ? [{ ...current[0], text: hook.text }, ...current.slice(1)]
        : [
            {
              speaker: '',
              text: hook.text,
              shot: '',
              reaction: '',
              pauseSeconds: 0,
              delivery: '',
            },
          ]
      : current;
  const spoken = spokenText({ narration, lines });

  return {
    ...scene,
    narration,
    ...(skit ? { lines } : {}),
    visual:
      parts.visual && hook.openingShot.trim() ? hook.openingShot : scene.visual,
    durationSeconds: fitDuration(
      scene.durationSeconds,
      spoken,
      linePauses({ lines }),
    ),
    reportedClaims: keepPresentClaims(
      [...new Set([...scene.reportedClaims, ...hook.reportedClaims])],
      [spoken, scene.onScreenText].join(' '),
    ),
  };
}

function fitSceneLengths(scenes: ScriptSceneRecord[]): ScriptSceneRecord[] {
  return scenes.map((scene) => ({
    ...scene,
    durationSeconds: fitDuration(
      scene.durationSeconds,
      spokenText(scene),
      linePauses(scene),
    ),
  }));
}

/**
 * A skit scene's lines as edited: trimmed, at most 3, a line with no text
 * dropped. Each keeps its beat; a direction left out reads empty, a pause 0.
 */
function editLines(lines: SceneLineInput[]): SceneLineRecord[] {
  const kept = lines
    .map((line, index) => {
      const field = `input.scenes.lines.${index}`;
      const pauseSeconds = line.pauseSeconds ?? 0;

      if (snapPause(pauseSeconds) !== pauseSeconds) {
        throw new ValidationError(
          `Use 0 to ${LIMITS.maxPause} seconds in steps of 0.5.`,
          { field: `${field}.pauseSeconds` },
        );
      }

      return {
        speaker: limit(line.speaker, LIMITS.speaker, `${field}.speaker`),
        text: limit(line.text, LIMITS.line, `${field}.text`),
        shot: limit(line.shot ?? '', LIMITS.shot, `${field}.shot`),
        reaction: limit(
          line.reaction ?? '',
          LIMITS.reaction,
          `${field}.reaction`,
        ),
        pauseSeconds,
        delivery: limit(
          line.delivery ?? '',
          LIMITS.delivery,
          `${field}.delivery`,
        ),
      };
    })
    .filter((line) => line.text);

  if (kept.length > LIMITS.maxLines) {
    throw new ValidationError('Add at most 3 lines.', {
      field: 'input.scenes.lines',
    });
  }

  return kept;
}

function limit(value: string, max: number, field: string): string {
  const text = value.trim();

  if (text.length > max) {
    throw new ValidationError(`Use ${max} characters or fewer.`, { field });
  }

  return text;
}

/**
 * Applies a partial direction edit. A version written before shot direction
 * existed has none; an edit to it starts from an empty product-only shot.
 */
function editDirection(
  current: SceneDirectionRecord | null,
  edit: SceneDirectionInput | null | undefined,
): SceneDirectionRecord | null {
  if (!edit) return current;

  const base: SceneDirectionRecord = current ?? {
    inFrame: ShotSubject.PRODUCT_ONLY,
    framing: ShotFraming.MEDIUM,
    setting: '',
    props: '',
  };

  return {
    inFrame: edit.inFrame ?? base.inFrame,
    framing: edit.framing ?? base.framing,
    setting:
      edit.setting === undefined || edit.setting === null
        ? base.setting
        : limit(edit.setting, LIMITS.setting, 'input.scenes.direction.setting'),
    props:
      edit.props === undefined || edit.props === null
        ? base.props
        : limit(edit.props, LIMITS.props, 'input.scenes.direction.props'),
  };
}

function editShoot(
  current: ShootPlanRecord | null,
  edit: ShootPlanInput,
): ShootPlanRecord {
  return {
    scenario:
      edit.scenario === undefined || edit.scenario === null
        ? (current?.scenario ?? '')
        : limit(edit.scenario, LIMITS.scenario, 'input.shoot.scenario'),
    presenter:
      edit.presenter === undefined || edit.presenter === null
        ? (current?.presenter ?? null)
        : limit(edit.presenter, LIMITS.presenter, 'input.shoot.presenter') ||
          null,
  };
}

/** A reported claim stays only while its wording is still in the line. */
function keepPresentClaims(claims: string[], text: string): string[] {
  const normalized = normalizeClaim(text);

  return claims.filter((claim) => normalized.includes(normalizeClaim(claim)));
}

/**
 * One flag per claim: a rule flag whose wording sits inside a claim that is
 * already flagged as not an approved fact is folded into that flag, which is
 * the actionable one (edit the line, or add the claim as a fact).
 */
function dedupe(flags: ClaimFlag[]): ClaimFlag[] {
  const seen = new Set<string>();
  const unapproved = flags
    .filter((flag) => flag.category === ClaimFlagCategory.NOT_APPROVED_FACT)
    .map((flag) => normalizeClaim(flag.claim));

  return flags.filter((flag) => {
    if (
      flag.category !== ClaimFlagCategory.NOT_APPROVED_FACT &&
      unapproved.some((claim) => claim.includes(normalizeClaim(flag.claim)))
    ) {
      return false;
    }

    const key = `${flag.category}:${normalizeClaim(flag.claim)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
