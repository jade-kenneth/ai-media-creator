import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentOwner } from 'src/common/decorators/current-owner.decorator';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type { OwnerContext } from 'src/common/types/owner-context';
import type {
  CopyScriptVersionInput,
  CreatorBrief,
  GenerationJob,
  RewriteHookInput,
  RewriteSceneInput,
  ScriptVersion,
  UpdateScriptVersionInput,
  WriteScriptInput,
} from 'src/graphql/generated/graphql';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import { CreatorBriefService } from './creator-brief.service';
import { ScriptsService } from './scripts.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class ScriptsResolver {
  constructor(
    private readonly scriptsService: ScriptsService,
    private readonly briefService: CreatorBriefService,
    private readonly jobsService: GenerationJobsService,
  ) {}

  @Query('scriptVersions')
  scriptVersions(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ScriptVersion[]> {
    return this.scriptsService.list(projectId, owner);
  }

  @Query('creatorBrief')
  creatorBrief(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<CreatorBrief> {
    return this.briefService.build(projectId, owner);
  }

  @Mutation('writeScript')
  async writeScript(
    @ServiceValidatedArgs('input') input: WriteScriptInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<GenerationJob> {
    return this.jobsService.toGraphql(
      await this.scriptsService.writeScript(
        owner,
        input.projectId,
        input.idempotencyKey,
      ),
    );
  }

  @Mutation('rewriteHook')
  async rewriteHook(
    @ServiceValidatedArgs('input') input: RewriteHookInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<GenerationJob> {
    return this.jobsService.toGraphql(
      await this.scriptsService.rewrite(
        owner,
        { versionId: input.versionId, hookId: input.hookId },
        input.idempotencyKey,
      ),
    );
  }

  @Mutation('rewriteScene')
  async rewriteScene(
    @ServiceValidatedArgs('input') input: RewriteSceneInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<GenerationJob> {
    return this.jobsService.toGraphql(
      await this.scriptsService.rewrite(
        owner,
        { versionId: input.versionId, sceneId: input.sceneId },
        input.idempotencyKey,
      ),
    );
  }

  @Mutation('updateScriptVersion')
  updateScriptVersion(
    @ServiceValidatedArgs('input') input: UpdateScriptVersionInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ScriptVersion> {
    return this.scriptsService.update(owner, input);
  }

  @Mutation('approveScriptVersion')
  approveScriptVersion(
    @Args('id') id: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ScriptVersion> {
    return this.scriptsService.approve(id, owner);
  }

  @Mutation('copyScriptVersion')
  copyScriptVersion(
    @ServiceValidatedArgs('input') input: CopyScriptVersionInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ScriptVersion> {
    return this.scriptsService.copy(owner, input);
  }
}
