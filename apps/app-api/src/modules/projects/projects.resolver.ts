import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentOwner } from 'src/common/decorators/current-owner.decorator';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type { OwnerContext } from 'src/common/types/owner-context';
import type {
  CreateProjectInput,
  GenerationJob,
  ImportProductInput,
  ProductImportResult,
  Project,
  ProjectConnection,
  ProjectCounts,
  ProjectFilterInput,
  ProjectSortInput,
  RenameProjectInput,
  StudioInfo,
  SuggestAnglesInput,
  SuggestAudiencesInput,
  SuggestPremisesInput,
  UpdateProductInput,
  UpdateStoryInput,
  UpdateStrategyInput,
} from 'src/graphql/generated/graphql';
import type { CursorPaginationInput } from 'src/libs/repository';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import { studioInfos } from '../studios/studios';
import { ProjectsService } from './projects.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class ProjectsResolver {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly jobsService: GenerationJobsService,
  ) {}

  @Query('projects')
  projects(
    @CurrentOwner() owner: OwnerContext,
    @Args('filter') filter?: ProjectFilterInput | null,
    @Args('sort') sort?: ProjectSortInput | null,
    @Args('pagination') pagination?: CursorPaginationInput | null,
  ): Promise<ProjectConnection> {
    return this.projectsService.list(owner, filter, sort, pagination);
  }

  @Query('projectCounts')
  projectCounts(@CurrentOwner() owner: OwnerContext): Promise<ProjectCounts> {
    return this.projectsService.counts(owner);
  }

  @Query('project')
  project(
    @Args('id') id: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<Project> {
    return this.projectsService.get(id, owner);
  }

  @Query('studios')
  studios(): StudioInfo[] {
    return studioInfos();
  }

  @Mutation('createProject')
  createProject(
    @ServiceValidatedArgs('input') input: CreateProjectInput | null,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<Project> {
    return this.projectsService.create(owner, input);
  }

  @Mutation('renameProject')
  renameProject(
    @ServiceValidatedArgs('input') input: RenameProjectInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<Project> {
    return this.projectsService.rename(owner, input);
  }

  @Mutation('updateProduct')
  updateProduct(
    @ServiceValidatedArgs('input') input: UpdateProductInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<Project> {
    return this.projectsService.updateProduct(owner, input);
  }

  @Mutation('importProduct')
  importProduct(
    @ServiceValidatedArgs('input') input: ImportProductInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ProductImportResult> {
    return this.projectsService.importProduct(owner, input);
  }

  @Mutation('clearImportedProductValues')
  clearImportedProductValues(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<Project> {
    return this.projectsService.clearImported(owner, projectId);
  }

  @Mutation('updateStrategy')
  updateStrategy(
    @ServiceValidatedArgs('input') input: UpdateStrategyInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<Project> {
    return this.projectsService.updateStrategy(owner, input);
  }

  @Mutation('suggestAngles')
  async suggestAngles(
    @ServiceValidatedArgs('input') input: SuggestAnglesInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<GenerationJob> {
    const job = await this.projectsService.suggestAngles(
      owner,
      input.projectId,
      input.idempotencyKey,
    );

    return this.jobsService.toGraphql(job);
  }

  @Mutation('updateStory')
  updateStory(
    @ServiceValidatedArgs('input') input: UpdateStoryInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<Project> {
    return this.projectsService.updateStory(owner, input);
  }

  @Mutation('suggestPremises')
  async suggestPremises(
    @ServiceValidatedArgs('input') input: SuggestPremisesInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<GenerationJob> {
    const job = await this.projectsService.suggestPremises(
      owner,
      input.projectId,
      input.idempotencyKey,
    );

    return this.jobsService.toGraphql(job);
  }

  @Mutation('suggestAudiences')
  async suggestAudiences(
    @ServiceValidatedArgs('input') input: SuggestAudiencesInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<GenerationJob> {
    const job = await this.projectsService.suggestAudiences(
      owner,
      input.projectId,
      input.idempotencyKey,
    );

    return this.jobsService.toGraphql(job);
  }
}
