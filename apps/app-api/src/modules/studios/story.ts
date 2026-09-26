import { StoryGenre, Storytelling } from 'src/graphql/generated/graphql';

/**
 * Entertainment Studio's story data (Product Specification §3.23): genre
 * notes, moods and the story rules (R28 D6). Shared by the premise and
 * script prompts and the AI clip context, so one wording reaches the model.
 */

export const STORY_LIMITS = {
  cast: 4,
  detail: 160,
  name: 24,
  role: 80,
  look: 80,
  ownPremise: 280,
  premiseTitle: 60,
  logline: 200,
  lengths: [30, 45, 60] as readonly number[],
} as const;

export const GENRE_LABELS: Record<StoryGenre, string> = {
  [StoryGenre.DRAMA]: 'Drama',
  [StoryGenre.ACTION]: 'Action',
  [StoryGenre.COMEDY]: 'Comedy',
  [StoryGenre.ROMANCE]: 'Romance',
  [StoryGenre.HORROR]: 'Horror',
  [StoryGenre.MYSTERY]: 'Mystery',
  [StoryGenre.FANTASY]: 'Fantasy',
  [StoryGenre.SLICE_OF_LIFE]: 'Slice of life',
};

/** The Story step's hint for each genre, also given to the model. */
export const GENRE_NOTES: Record<StoryGenre, string> = {
  [StoryGenre.DRAMA]: 'Real feelings, a hard choice, a moment that lands.',
  [StoryGenre.ACTION]:
    'Clear stakes and movement. Fights and chases stay stylised, with no gore.',
  [StoryGenre.COMEDY]: 'A setup, a turn and a punchline. Timing does the work.',
  [StoryGenre.ROMANCE]:
    'Two people and one spark or misunderstanding. No sexual content.',
  [StoryGenre.HORROR]: 'Scares come from suspense and sound, not gore.',
  [StoryGenre.MYSTERY]:
    'A question in the first seconds and a reveal at the end.',
  [StoryGenre.FANTASY]: 'One impossible thing in an ordinary world.',
  [StoryGenre.SLICE_OF_LIFE]: 'Small, true-to-life moments people recognise.',
};

/** The mood an AI clip description asks for, by genre. */
export const GENRE_MOODS: Record<StoryGenre, string> = {
  [StoryGenre.DRAMA]: 'quiet and emotional',
  [StoryGenre.ACTION]: 'fast and tense',
  [StoryGenre.COMEDY]: 'light and comic',
  [StoryGenre.ROMANCE]: 'warm and tender',
  [StoryGenre.HORROR]: 'tense and eerie',
  [StoryGenre.MYSTERY]: 'hushed and curious',
  [StoryGenre.FANTASY]: 'bright and wondrous',
  [StoryGenre.SLICE_OF_LIFE]: 'natural and everyday',
};

export const STORYTELLING_LABELS: Record<Storytelling, string> = {
  [Storytelling.ACTED]: 'Acted',
  [Storytelling.NARRATED]: 'Narrated',
};

/** R28 D6: the PG-13 ceiling, written into every story prompt. */
export const STORY_RULES = [
  'Stories are fiction: never present one as real news or as something that really happened.',
  'Keep it PG-13. Action and fights stay stylised, with no gore, no graphic injury and no real-weapon how-to.',
  'Horror scares through suspense and sound, never gore.',
  'Romance has no sexual content.',
  'No one under 18 appears in romance or violence.',
  'Never use a real public figure, celebrity or real person as a character; use only the cast names given.',
  'No brand names and no product promotion.',
].join(' ');

/**
 * R29: every story ends on a cliffhanger. Joins every story write and rewrite
 * prompt; coercion also makes the last scene the PAYOFF (Cliffhanger) scene.
 */
export const STORY_ENDING_RULE = [
  'The last scene is the PAYOFF scene and it ends on a cliffhanger.',
  'It lands the moment the story built to, then leaves a reveal, a twist or a question open that makes viewers want the next part.',
  'Never resolve everything, and never end on a summary or a moral.',
  'Its visual ends on the cliffhanger moment, and in an acted story its last line is the cliffhanger.',
].join(' ');

/**
 * §3.25: a series' final episode ends the story. Replaces the cliffhanger
 * rule in its write and rewrite prompts; coercion is unchanged (the last
 * scene is still the PAYOFF scene).
 */
export const STORY_FINAL_RULE = [
  'This is the final episode of the series, so the last scene is the PAYOFF scene and it ends the story.',
  'It lands the moment the series built to and resolves the main question the earlier episodes left open.',
  'Never open a new question, and never end on a cliffhanger, a summary or a moral.',
  'Its visual ends on the resolved moment, and in an acted story its last line closes the story.',
].join(' ');

/** Episode 2+ (§3.25): how an episode continues the series. */
export const STORY_CONTINUITY_RULE = [
  'This story is one episode of a series ("continuity" gives the series premise, what happened in earlier episodes and the previous episode in full).',
  "Pick up from the previous episode's cliffhanger in the first scene: resolve it or deepen it in the first seconds.",
  "Keep every character's name, way of speaking and look, and never contradict what already happened.",
].join(' ');

/** The rule the prompts add for acted stories, in place of the skit's product rules. */
export const ACTED_STORY_RULES = [
  'Write a short scene acted out by the cast, not an ad.',
  'It has a setup, a turn and a payoff inside the premise.',
  'People talk like real people in the chosen language, and the genre sets the mood.',
  'There is no narrator, so narration is always empty.',
].join(' ');

/** One character as the prompts and clip descriptions describe them. */
export function describeCharacter(character: {
  name: string;
  role: string;
  look: string;
}): string {
  return [character.name, character.role, character.look]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}

/** The Shoot plan's Cast line, clipped to the presenter limit. */
export function castLine(
  cast: Array<{ name: string; role: string; look: string }>,
  max = 160,
): string | null {
  const line = cast.map(describeCharacter).filter(Boolean).join('; ');

  if (!line) return null;
  if (line.length <= max) return line;

  // Cut at the last word that fits, leaving room for the ellipsis.
  const cut = line.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const kept = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut;

  return `${kept.replace(/[\s,;:.-]+$/, '')}…`;
}
