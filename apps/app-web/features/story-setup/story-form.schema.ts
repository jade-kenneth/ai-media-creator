import { z } from 'zod';

import { STORY_LENGTHS, STORY_LIMITS } from '@/lib/studios';
import {
  PremiseKind,
  ScriptLanguage,
  StoryGenre,
  Storytelling,
  type StoryCharacterInput,
  type StoryPremiseInput,
  type UpdateStoryInput,
} from '@/react-query/generated__types';
import type { ProjectDetail } from '@/react-query/projects/projects-operations';

/** The premise radio value for “Write my own premise”. */
export const OWN_PREMISE = 'own';

export type StoryPatch = Omit<UpdateStoryInput, 'projectId'>;

type CharacterValues = { id: string; name: string; role: string; look: string };
type CastField = 'name' | 'role' | 'look';

export interface CastIssue {
  index: number;
  field: CastField;
  message: string;
}

/** Whitespace collapsed and trimmed, as the API stores it. */
export function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** A row the creator hasn't typed anything into. */
export function isBlankCharacter(character: CharacterValues): boolean {
  return (
    !collapse(character.name) &&
    !collapse(character.role) &&
    !collapse(character.look)
  );
}

/**
 * The cast rules the API enforces (§3.23 Writes): a name of 1–24 characters,
 * unique ignoring case, and a role and look of at most 80. A duplicate is
 * reported on the later row, naming the earlier one.
 */
export function castIssues(cast: CharacterValues[]): CastIssue[] {
  const issues: CastIssue[] = [];
  const seen = new Map<string, string>();

  cast.forEach((character, index) => {
    const name = collapse(character.name);

    if (!name) {
      issues.push({ index, field: 'name', message: 'Add a name.' });
    } else if (name.length > STORY_LIMITS.name) {
      issues.push({
        index,
        field: 'name',
        message: `Use ${STORY_LIMITS.name} characters or fewer.`,
      });
    } else {
      const first = seen.get(name.toLowerCase());

      if (first) {
        issues.push({
          index,
          field: 'name',
          message: `You already have ${first}.`,
        });
      } else {
        seen.set(name.toLowerCase(), name);
      }
    }

    for (const field of ['role', 'look'] as const) {
      if (collapse(character[field]).length > STORY_LIMITS[field]) {
        issues.push({
          index,
          field,
          message: `Use ${STORY_LIMITS[field]} characters or fewer.`,
        });
      }
    }
  });

  return issues;
}

const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  look: z.string(),
});

/**
 * The Story step's editable values. The cast rules run as one refinement on
 * the list so a blank row never stops the duplicate check.
 */
export const storyFormSchema = z.object({
  genre: z.enum(StoryGenre).nullable(),
  detail: z
    .string()
    .refine(
      (value) => collapse(value).length <= STORY_LIMITS.detail,
      `Use ${STORY_LIMITS.detail} characters or fewer.`,
    ),
  /** A suggestion id, `OWN_PREMISE`, or '' when nothing is chosen. */
  premiseChoice: z.string(),
  ownText: z
    .string()
    .max(
      STORY_LIMITS.ownPremise,
      `Use ${STORY_LIMITS.ownPremise} characters or fewer.`,
    ),
  cast: z
    .array(characterSchema)
    .max(STORY_LIMITS.cast, `Up to ${STORY_LIMITS.cast} characters.`)
    .superRefine((cast, context) => {
      for (const issue of castIssues(cast)) {
        context.addIssue({
          code: 'custom',
          path: [issue.index, issue.field],
          message: issue.message,
        });
      }
    }),
  storytelling: z.enum(Storytelling),
  language: z.enum(ScriptLanguage),
  lengthSeconds: z
    .number()
    .refine((value) => STORY_LENGTHS.some((length) => length === value)),
});

export type StoryFormValues = z.infer<typeof storyFormSchema>;

/** The one place the form's values are read from a project. */
export function getStoryDefaults(
  story: ProjectDetail['story'],
): StoryFormValues {
  const premise = story?.premise;

  return {
    genre: story?.genre ?? null,
    detail: story?.detail ?? '',
    premiseChoice: !premise
      ? ''
      : premise.kind === PremiseKind.Own
        ? OWN_PREMISE
        : (premise.suggestionId ?? ''),
    ownText: premise?.kind === PremiseKind.Own ? premise.logline : '',
    cast: (story?.cast ?? []).map(({ id, name, role, look }) => ({
      id,
      name,
      role,
      look,
    })),
    storytelling: story?.storytelling ?? Storytelling.Acted,
    language: story?.language ?? ScriptLanguage.Taglish,
    lengthSeconds: story?.lengthSeconds ?? 45,
  };
}

/**
 * The cast the API gets: named rows only (a row with no name stays on screen
 * but isn't saved), or null while a named row breaks a rule, so the last
 * good cast stays stored.
 */
export function toCastInput(
  cast: CharacterValues[],
): StoryCharacterInput[] | null {
  const named = cast.filter((character) => collapse(character.name));

  if (castIssues(named).length > 0) return null;

  return named.map((character) => ({
    id: character.id,
    name: collapse(character.name),
    role: collapse(character.role),
    look: collapse(character.look),
  }));
}

/** The premise write for the current choice, or null when there's none. */
export function toPremiseInput(
  values: StoryFormValues,
): StoryPremiseInput | null {
  if (values.premiseChoice === OWN_PREMISE) {
    return values.ownText.length <= STORY_LIMITS.ownPremise
      ? { kind: PremiseKind.Own, text: values.ownText }
      : null;
  }

  return values.premiseChoice
    ? { kind: PremiseKind.Suggested, suggestionId: values.premiseChoice }
    : null;
}

/**
 * A client-made character id (8–64 letters, digits, `-` or `_`, as the API
 * accepts), so an overlapping autosave can't add the same character twice.
 */
export function newCharacterId(): string {
  return crypto.randomUUID();
}
