import { Injectable } from '@nestjs/common';
import { ConflictError } from 'src/common/errors/app.error';
import type { OwnerContext } from 'src/common/types/owner-context';
import {
  ProjectStatus,
  ProjectStepKey,
  type Project,
} from 'src/graphql/generated/graphql';
import { AssetsService } from '../assets/assets.service';
import { FactsService } from '../facts/facts.service';
import { ProjectsService, readStory } from '../projects/projects.service';
import { studioFor } from '../studios/studios';
import { ScriptsService } from '../scripts/scripts.service';

/**
 * Duplicating is how a creator tests another hook while keeping the finished
 * original (brief §6.9). It lives above the studio modules so none of them
 * needs to know about the others.
 */
@Injectable()
export class ProjectDuplicatesService {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly factsService: FactsService,
    private readonly assetsService: AssetsService,
    private readonly scriptsService: ScriptsService,
  ) {}

  async duplicate(id: string, owner: OwnerContext): Promise<Project> {
    const source = await this.projectsService.getRecord(id, owner);
    const studio = studioFor(source);
    const hasStory = studio.intakeSteps.includes(ProjectStepKey.STORY);

    if (hasStory && !readStory(source).genre) {
      throw new ConflictError('Pick a genre first.', { code: 'NO_GENRE' });
    }

    if (!hasStory && !source.product.title) {
      throw new ConflictError('Add a product first.', { code: 'NO_PRODUCT' });
    }

    const title = `${source.title} (copy)`.slice(0, 80);
    const copy = await this.projectsService.insert(owner, {
      title,
      studioType: studio.type,
      status:
        source.status === ProjectStatus.DRAFT || hasStory
          ? ProjectStatus.DRAFT
          : ProjectStatus.FACTS_REVIEW,
      product: source.product,
      strategy: source.strategy,
      angleSuggestionSet: source.angleSuggestionSet,
      ...(hasStory
        ? {
            story: readStory(source),
            premiseSuggestionSet: source.premiseSuggestionSet ?? null,
          }
        : {}),
    });

    const factIdMap = await this.factsService.copyToProject(
      source.id,
      copy.id,
      owner,
    );
    await this.assetsService.copyToProject(source.id, copy.id, owner);

    const refreshed = await this.projectsService.getRecord(copy.id, owner);
    await this.scriptsService.copyApprovedToProject(
      source.id,
      refreshed,
      owner,
      factIdMap,
    );

    if (
      source.status !== ProjectStatus.DRAFT &&
      refreshed.scriptSummary.versionCount > 0
    ) {
      await this.projectsService.setStatus(
        copy.id,
        owner,
        ProjectStatus.SCRIPT_REVIEW,
      );
    }

    return this.projectsService.get(copy.id, owner);
  }
}
