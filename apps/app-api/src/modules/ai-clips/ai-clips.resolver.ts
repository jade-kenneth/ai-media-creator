import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentOwner } from 'src/common/decorators/current-owner.decorator';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type { OwnerContext } from 'src/common/types/owner-context';
import type {
  ClaimFlag,
  GenerateSceneClipsInput,
  GenerationJob,
  ProjectAsset,
} from 'src/graphql/generated/graphql';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import { AiClipsService } from './ai-clips.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class AiClipsResolver {
  constructor(
    private readonly aiClipsService: AiClipsService,
    private readonly jobsService: GenerationJobsService,
  ) {}

  @Query('clipPromptFlags')
  clipPromptFlags(
    @Args('projectId') projectId: string,
    @Args('prompt') prompt: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ClaimFlag[]> {
    return this.aiClipsService.promptFlags(projectId, prompt, owner);
  }

  @Mutation('generateSceneClips')
  async generateSceneClips(
    @ServiceValidatedArgs('input') input: GenerateSceneClipsInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<GenerationJob> {
    return this.jobsService.toGraphql(
      await this.aiClipsService.generate(input, owner),
    );
  }

  @Mutation('checkAiClip')
  checkAiClip(
    @Args('id') id: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ProjectAsset> {
    return this.aiClipsService.check(id, owner);
  }

  @Mutation('discardAiClips')
  discardAiClips(
    @Args('jobId') jobId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<boolean> {
    return this.aiClipsService.discard(jobId, owner);
  }
}
