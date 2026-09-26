import { Injectable, OnModuleInit } from '@nestjs/common';
import type { OwnerContext } from 'src/common/types/owner-context';
import {
  ContentStyle,
  GenerationFailureCode,
  GenerationJobType,
} from 'src/graphql/generated/graphql';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import {
  GenerationJobError,
  type GenerationJobContext,
  type GenerationJobHandler,
  type GenerationJobResult,
} from '../generation-jobs/generation-jobs.types';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import { ProjectsService } from '../projects/projects.service';
import { TextGenerationService } from '../text-generation/text-generation.service';
import type { ScriptVersionRecord } from './repositories/scripts.repository';
import { scriptStudioFor, versionStudio } from './script-studios';
import {
  allowHookTypes,
  coerceDraft,
  coerceHook,
  coerceScene,
  fitDuration,
  hookScene,
  isSkit,
  linePauses,
  normalizeTransitions,
  purposeInPlace,
  spokenText,
  type WritingContext,
} from './script-writing';
import { ScriptsService } from './scripts.service';

const INCOMPLETE = 'The draft came back incomplete, so we didn’t use it.';

/**
 * Runs the three writing jobs. Each makes the provider call first and saves
 * only after a usable result, so a failure never touches existing versions.
 * Steps shown in the job panel: 0 reading approved facts (a story: the
 * story), 1 writing, 2 checking. The prompts, schemas and allowlists are the
 * studio's (`script-studios.ts`); rewrites follow the version's studio.
 */
@Injectable()
export class ScriptJobsHandler implements GenerationJobHandler, OnModuleInit {
  constructor(
    private readonly handlers: GenerationJobHandlers,
    private readonly projectsService: ProjectsService,
    private readonly scriptsService: ScriptsService,
    private readonly textGeneration: TextGenerationService,
  ) {}

  onModuleInit(): void {
    this.handlers.register(GenerationJobType.WRITE_SCRIPT, this);
    this.handlers.register(GenerationJobType.REWRITE_HOOK, this);
    this.handlers.register(GenerationJobType.REWRITE_SCENE, this);
  }

  async run(
    job: GenerationJobRecord,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult> {
    const owner: OwnerContext = {
      ownerId: job.ownerId,
      organizationId: job.organizationId,
    };

    switch (job.type) {
      case GenerationJobType.WRITE_SCRIPT:
        return this.writeScript(job, owner, context);
      case GenerationJobType.REWRITE_HOOK:
        return this.rewriteHook(job, owner, context);
      default:
        return this.rewriteScene(job, owner, context);
    }
  }

  private async writeScript(
    job: GenerationJobRecord,
    owner: OwnerContext,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult> {
    const project = await this.projectsService.getRecord(job.projectId, owner);
    const { definition, scripts } = scriptStudioFor(project);
    const approvedIds = new Set(project.approvedFacts.map((fact) => fact.id));
    const writing = this.scriptsService.writingContext(project);
    const skit = isSkit(writing.strategy.contentStyle);
    const request = scripts.script(writing, definition);

    await context.setStep(1);

    const draft = request.parse(
      await this.textGeneration.generateJson({
        schemaName: 'script_draft',
        schema: request.schema,
        messages: request.messages,
      }),
    );

    if (!draft) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        INCOMPLETE,
      );
    }

    await context.setStep(2);

    const coerced = coerceDraft(draft, definition, approvedIds, skit);

    if (!coerced) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        INCOMPLETE,
      );
    }

    const versionId = await this.scriptsService.createWrittenVersion(
      project,
      owner,
      { contentStyle: writing.strategy.contentStyle, ...coerced },
    );

    return { resultVersionId: versionId };
  }

  private async rewriteHook(
    job: GenerationJobRecord,
    owner: OwnerContext,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult> {
    const version = await this.scriptsService.getRecord(
      job.input.versionId ?? '',
      owner,
    );
    const project = await this.projectsService.getRecord(
      version.projectId,
      owner,
    );
    const current = version.hooks.find((hook) => hook.id === job.input.hookId);

    if (!current) {
      throw new GenerationJobError(
        GenerationFailureCode.INTERNAL,
        'That hook no longer exists.',
      );
    }

    // Rewrites follow the studio the version was written for.
    const { definition, scripts } = versionStudio(version);
    const others = version.hooks.filter((hook) => hook.id !== current.id);
    const request = scripts.hook(
      versionContext(scripts.context(project), version),
      definition,
      others.map((hook) => hook.text),
      current.text,
    );

    await context.setStep(1);

    const output = request.parse(
      await this.textGeneration.generateJson({
        schemaName: 'hook_rewrite',
        schema: request.schema,
        messages: request.messages,
      }),
    );
    const coerced = output ? coerceHook(output, current.id) : null;
    const hook = coerced
      ? allowHookTypes(
          [coerced],
          definition.hookTypes,
          others.map((item) => item.type),
        )[0]
      : null;

    if (!hook) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        INCOMPLETE,
      );
    }

    await this.scriptsService.replaceItem(version.id, owner, { hook });

    return { resultVersionId: version.id };
  }

  private async rewriteScene(
    job: GenerationJobRecord,
    owner: OwnerContext,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult> {
    const version = await this.scriptsService.getRecord(
      job.input.versionId ?? '',
      owner,
    );
    const project = await this.projectsService.getRecord(
      version.projectId,
      owner,
    );
    const current = version.scenes.find(
      (scene) => scene.id === job.input.sceneId,
    );

    if (!current) {
      throw new GenerationJobError(
        GenerationFailureCode.INTERNAL,
        'That scene no longer exists.',
      );
    }

    // Rewrites follow the studio and style the version was written in.
    const { definition, scripts } = versionStudio(version);
    const writing = versionContext(scripts.context(project), version);
    const skit = isSkit(writing.strategy.contentStyle);
    // The scene keeps its place and purpose; a studio's ending rule holds.
    const purpose = purposeInPlace(
      current,
      version.scenes,
      definition.lastScene,
    );
    const request = scripts.scene(
      writing,
      definition,
      version.scenes,
      // The length the creator sees (a draft reads with fitted lengths).
      {
        ...current,
        purpose,
        durationSeconds: fitDuration(
          current.durationSeconds,
          spokenText(current),
          linePauses(current),
        ),
      },
      version.shoot ?? null,
      // Scene 1 keeps the chosen hook's words (enforced on save).
      hookScene(version.scenes)?.id === current.id
        ? (version.hooks.find((hook) => hook.id === version.selectedHookId)
            ?.text ?? null)
        : null,
    );

    await context.setStep(1);

    const output = request.parse(
      await this.textGeneration.generateJson({
        schemaName: 'scene_rewrite',
        schema: request.schema,
        messages: request.messages,
      }),
    );
    const candidate = output
      ? coerceScene(
          { ...output, purpose },
          current.order,
          new Set(project.approvedFacts.map((fact) => fact.id)),
          current.id,
          skit,
        )
      : null;

    if (!candidate) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        INCOMPLETE,
      );
    }

    const scene = normalizeTransitions(
      version.scenes.map((item) =>
        item.id === candidate.id ? candidate : item,
      ),
      candidate.id,
    ).find((item) => item.id === candidate.id);

    if (!scene) {
      throw new GenerationJobError(
        GenerationFailureCode.INTERNAL,
        'That scene no longer exists.',
      );
    }

    await this.scriptsService.replaceItem(version.id, owner, { scene });

    return { resultVersionId: version.id };
  }
}

/**
 * Rewrites follow the style the version was written in, not the project's
 * current one; versions from before skits existed are narrated.
 */
function versionContext(
  context: WritingContext,
  version: ScriptVersionRecord,
): WritingContext {
  const contentStyle =
    version.contentStyle ??
    (isSkit(context.strategy.contentStyle)
      ? ContentStyle.VOICEOVER_PRODUCT_SHOTS
      : context.strategy.contentStyle);

  return { ...context, strategy: { ...context.strategy, contentStyle } };
}
