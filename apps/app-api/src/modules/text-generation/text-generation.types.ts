import { GenerationFailureCode } from 'src/graphql/generated/graphql';
import { GenerationJobError } from '../generation-jobs/generation-jobs.types';

export interface TextGenerationMessage {
  role: 'system' | 'user';
  content: string;
}

export interface TextGenerationRequest {
  /** Identifies the JSON schema to the provider, e.g. `script_draft`. */
  schemaName: string;
  /** A strict JSON schema the response must follow. */
  schema: Record<string, unknown>;
  messages: TextGenerationMessage[];
}

export type TextProviderName = 'openai' | 'anthropic' | 'deepseek' | 'minimax';

/** One text model vendor. Keys stay server-side; output is untrusted JSON. */
export interface TextProvider {
  readonly name: TextProviderName;
  isConfigured(): boolean;
  generateJson(request: TextGenerationRequest): Promise<unknown>;
}

/**
 * A thinking model writing a full script draft takes about a minute, so the
 * cap sits well above that. It outlasts the text queue's lease, which the
 * queue's heartbeat renews while a call runs (TEXT_JOB_QUEUE).
 */
export const TEXT_PROVIDER_TIMEOUT_MS = 180_000;

export const textProviderErrors = {
  notConfigured: () =>
    new GenerationJobError(
      GenerationFailureCode.PROVIDER_NOT_CONFIGURED,
      'The writing service isn’t set up yet.',
    ),
  timeout: () =>
    new GenerationJobError(
      GenerationFailureCode.PROVIDER_TIMEOUT,
      'The writing service timed out after 3 minutes.',
    ),
  rejected: () =>
    new GenerationJobError(
      GenerationFailureCode.PROVIDER_REJECTED,
      'The writing service turned the request down.',
    ),
  invalidOutput: () =>
    new GenerationJobError(
      GenerationFailureCode.INVALID_OUTPUT,
      'The draft came back incomplete, so we didn’t use it.',
    ),
  internal: () =>
    new GenerationJobError(
      GenerationFailureCode.INTERNAL,
      'Something went wrong on our side.',
    ),
};

export function parseJsonOutput(content: string | null | undefined): unknown {
  try {
    return JSON.parse(content ?? '') as unknown;
  } catch {
    throw textProviderErrors.invalidOutput();
  }
}
