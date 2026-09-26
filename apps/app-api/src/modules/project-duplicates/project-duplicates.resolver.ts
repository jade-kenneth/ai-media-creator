import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentOwner } from 'src/common/decorators/current-owner.decorator';
import type { OwnerContext } from 'src/common/types/owner-context';
import type { Project } from 'src/graphql/generated/graphql';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { ProjectDuplicatesService } from './project-duplicates.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class ProjectDuplicatesResolver {
  constructor(private readonly duplicatesService: ProjectDuplicatesService) {}

  @Mutation('duplicateProject')
  duplicateProject(
    @Args('id') id: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<Project> {
    return this.duplicatesService.duplicate(id, owner);
  }
}
