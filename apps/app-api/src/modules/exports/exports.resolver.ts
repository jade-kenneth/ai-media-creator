import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentOwner } from 'src/common/decorators/current-owner.decorator';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type { OwnerContext } from 'src/common/types/owner-context';
import type {
  ExportDownload,
  GenerationJob,
  ProjectExports,
  RenderVideoInput,
} from 'src/graphql/generated/graphql';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import { ExportsService } from './exports.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class ExportsResolver {
  constructor(
    private readonly exportsService: ExportsService,
    private readonly jobsService: GenerationJobsService,
  ) {}

  @Query('projectExports')
  projectExports(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ProjectExports> {
    return this.exportsService.overview(projectId, owner);
  }

  @Mutation('renderVideo')
  async renderVideo(
    @ServiceValidatedArgs('input') input: RenderVideoInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<GenerationJob> {
    return this.jobsService.toGraphql(
      await this.exportsService.renderVideo(input, owner),
    );
  }

  @Mutation('createExportDownload')
  createExportDownload(
    @Args('id') id: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ExportDownload> {
    return this.exportsService.createDownload(id, owner);
  }
}
