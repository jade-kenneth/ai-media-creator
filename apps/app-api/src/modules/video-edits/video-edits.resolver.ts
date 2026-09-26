import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentOwner } from 'src/common/decorators/current-owner.decorator';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type { OwnerContext } from 'src/common/types/owner-context';
import type {
  GenerationJob,
  SwitchVideoEditVersionInput,
  UpdateVideoEditInput,
  VideoEdit,
  VoiceJobInput,
} from 'src/graphql/generated/graphql';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import { VideoEditsService } from './video-edits.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class VideoEditsResolver {
  constructor(
    private readonly videoEditsService: VideoEditsService,
    private readonly jobsService: GenerationJobsService,
  ) {}

  @Query('videoEdit')
  videoEdit(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<VideoEdit | null> {
    return this.videoEditsService.get(projectId, owner);
  }

  @Mutation('startVideoEdit')
  startVideoEdit(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<VideoEdit> {
    return this.videoEditsService.start(projectId, owner);
  }

  @Mutation('updateVideoEdit')
  updateVideoEdit(
    @ServiceValidatedArgs('input') input: UpdateVideoEditInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<VideoEdit> {
    return this.videoEditsService.update(input, owner);
  }

  @Mutation('autoFillSceneMedia')
  autoFillSceneMedia(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<VideoEdit> {
    return this.videoEditsService.autoFill(projectId, owner);
  }

  @Mutation('switchVideoEditVersion')
  switchVideoEditVersion(
    @ServiceValidatedArgs('input') input: SwitchVideoEditVersionInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<VideoEdit> {
    return this.videoEditsService.switchVersion(input, owner);
  }

  @Mutation('generateVoiceover')
  async generateVoiceover(
    @ServiceValidatedArgs('input') input: VoiceJobInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<GenerationJob> {
    return this.jobsService.toGraphql(
      await this.videoEditsService.generateVoiceover(input, owner),
    );
  }

  @Mutation('alignRecording')
  async alignRecording(
    @ServiceValidatedArgs('input') input: VoiceJobInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<GenerationJob> {
    return this.jobsService.toGraphql(
      await this.videoEditsService.alignRecording(input, owner),
    );
  }

  @Mutation('resetCaptions')
  resetCaptions(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<VideoEdit> {
    return this.videoEditsService.resetCaptions(projectId, owner);
  }
}
