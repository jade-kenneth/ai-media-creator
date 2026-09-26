import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import type { GenerationJob } from 'src/graphql/generated/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { GenerationJobsService } from './generation-jobs.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class GenerationJobsResolver {
  constructor(private readonly jobsService: GenerationJobsService) {}

  @Query('generationJob')
  async generationJob(
    @Args('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<GenerationJob> {
    const job = await this.jobsService.get(id, {
      ownerId: user.id,
      organizationId: tenantId ?? null,
    });

    return this.jobsService.toGraphql(job);
  }

  @Query('projectJobs')
  async projectJobs(
    @Args('projectId') projectId: string,
    @Args('active') active: boolean | null,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<GenerationJob[]> {
    const jobs = await this.jobsService.listForProject(
      projectId,
      { ownerId: user.id, organizationId: tenantId ?? null },
      active === true,
    );

    return jobs.map((job) => this.jobsService.toGraphql(job));
  }

  @Mutation('retryGenerationJob')
  async retryGenerationJob(
    @Args('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<GenerationJob> {
    const job = await this.jobsService.retry(id, {
      ownerId: user.id,
      organizationId: tenantId ?? null,
    });

    return this.jobsService.toGraphql(job);
  }
}
