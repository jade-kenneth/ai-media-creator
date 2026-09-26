import { Injectable } from '@nestjs/common';
import type { GenerationJobType } from 'src/graphql/generated/graphql';
import type { GenerationJobHandler } from './generation-jobs.types';

/**
 * Job types are owned by the modules that know how to run them (projects for
 * angle suggestions, scripts for writing and rewrites). Each registers its
 * handler on init, so this module never imports them.
 */
@Injectable()
export class GenerationJobHandlers {
  private readonly handlers = new Map<
    GenerationJobType,
    GenerationJobHandler
  >();

  register(type: GenerationJobType, handler: GenerationJobHandler): void {
    this.handlers.set(type, handler);
  }

  get(type: GenerationJobType): GenerationJobHandler | undefined {
    return this.handlers.get(type);
  }
}
