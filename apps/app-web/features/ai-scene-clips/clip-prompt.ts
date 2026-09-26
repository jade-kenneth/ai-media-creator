import {
  formatSeconds,
  isTimed,
  lineTimeline,
  roundedSpan,
  snapPause,
} from '@/features/script-studio/spoken-length';
import { SHOT_FRAMING_LABEL } from '@/lib/studio/labels';
import { GENRE_MOOD } from '@/lib/studios';
import {
  SceneClipMode,
  ScriptLanguage,
  ShotSubject,
  Tone,
  type ShotFraming,
  type StoryGenre,
} from '@/react-query/generated__types';

/** The API's limit; the video service reads far more (MiniMax H3, about 7,000). */
export const CLIP_PROMPT_MAX = 2000;
/** One clip by default; two to compare (R23). */
export const DEFAULT_CLIP_COUNT = 1;
export const MAX_CLIP_COUNT = 2;
/** The model makes whole-second clips from 5 to 15 s (MiniMax-H3-Max). */
export const MIN_CLIP_SECONDS = 5;
export const MAX_CLIP_SECONDS = 15;

/** A clip as long as its scene, within what the model makes (as the server does). */
export function clipSecondsFor(sceneSeconds: number): number {
  return Math.min(
    MAX_CLIP_SECONDS,
    Math.max(MIN_CLIP_SECONDS, Math.ceil(sceneSeconds)),
  );
}
/** Match my photos takes 2 to 4 photos (R23). */
export const MIN_REFERENCE_PHOTOS = 2;
export const MAX_REFERENCE_PHOTOS = 4;

/** The modes the clip sheet offers; one-click clips (`CONSISTENT`) choose their own photos. */
export type SheetClipMode = Exclude<SceneClipMode, SceneClipMode.Consistent>;

/**
 * How the sheet shows a job: a one-click clip reads as Match my photos, and
 * no job starts on the studio's first mode.
 */
export function sheetModeOf(
  mode: SceneClipMode | null | undefined,
  fallback: SheetClipMode = SceneClipMode.FirstFrame,
): SheetClipMode {
  if (!mode) return fallback;
  return mode === SceneClipMode.Consistent ? SceneClipMode.References : mode;
}

/** How many photos each mode takes; Describe only (stories) takes none. */
export const MODE_PHOTOS: Record<SheetClipMode, { min: number; max: number }> =
  {
    [SceneClipMode.Describe]: { min: 0, max: 0 },
    [SceneClipMode.FirstFrame]: { min: 1, max: 1 },
    [SceneClipMode.FirstLastFrame]: { min: 2, max: 2 },
    [SceneClipMode.References]: {
      min: MIN_REFERENCE_PHOTOS,
      max: MAX_REFERENCE_PHOTOS,
    },
  };

/** How a prompt names who is in frame (the UI labels address the creator). */
const IN_FRAME_PROMPT: Record<ShotSubject, string> = {
  [ShotSubject.Creator]: 'a person on camera',
  [ShotSubject.Hands]: 'hands only',
  [ShotSubject.ProductOnly]: 'product only',
};

/** A story has no product, so its empty frame names no one (§3.23 labels). */
const STORY_IN_FRAME_PROMPT: Record<ShotSubject, string> = {
  ...IN_FRAME_PROMPT,
  [ShotSubject.ProductOnly]: 'no one in frame',
};

/**
 * The description a clip request starts from (Design Reference §5.16): the
 * scene's shot direction, its suggested visual, and a close for the mode
 * that asks the service to keep the product as it is. A shot of the creator
 * describes the shoot plan's presenter, so every clip shows the same person.
 */
type ClipDirection = {
  framing: ShotFraming;
  inFrame: ShotSubject;
  setting: string;
  /** Comma-separated things in the shot; the clip sheet names them. */
  props?: string;
} | null;

/** A skit line and its beat: the camera, the reaction and its hold, the delivery. */
export type ClipLine = {
  speaker: string;
  text: string;
  shot?: string | null;
  reaction?: string | null;
  pauseSeconds?: number | null;
  delivery?: string | null;
};

/**
 * A skit scene's sound cue and spoken lines (§3.22). The video service makes
 * each clip's sound with its picture, so the description asks for that sound,
 * has the cast act out their lines, and leaves music to the creator's own
 * track. With the scene's length, timed lines are placed in it.
 */
export type ClipAudio = {
  sound: string | null;
  lines: ClipLine[];
  /** The scene's length in the video, which the beats' times are placed in. */
  seconds?: number;
} | null;

/** A story character a clip shows, and the look that describes them. */
export type ClipCharacter = { name: string; look?: string | null };

/**
 * What a clip takes from the script beyond its own scene: the skit's
 * situation and the project's tone for shots with people, the language the
 * lines are said in, the chosen hook's opening shot for the video's first
 * scene, and the product's name for the clip sheet's close.
 */
export type ClipContext = {
  /** The shoot plan's scenario; only a shot of people takes it. */
  scenario?: string | null;
  tone?: Tone | null;
  language?: ScriptLanguage | null;
  /** The chosen hook's opening shot; given for the first scene only. */
  openingShot?: string | null;
  /** The product's name; the one-click close names its items instead. */
  product?: string | null;
  /**
   * A story (§3.23 Clip prompts): the genre sets the mood in place of the
   * tone, the shot lead names the characters in this scene with their looks,
   * and no close names a product.
   */
  story?: {
    genre?: StoryGenre | null;
    /** The characters in this scene, in cast order. */
    characters: ClipCharacter[];
  } | null;
} | null;

/** With beat shots, the camera follows them instead of holding one slow move. */
const BEAT_CAMERA =
  'The camera is steady and changes only where a beat names a shot.';

/** How the acting plays in each tone. */
const TONE_MOOD: Record<Tone, string> = {
  [Tone.Friendly]: 'warm and friendly',
  [Tone.Energetic]: 'upbeat and energetic',
  [Tone.Calm]: 'calm and relaxed',
  [Tone.StraightTalking]: 'straight-talking and matter-of-fact',
};

/** The language the cast says the lines in, so the words come out right. */
const SPOKEN_IN: Record<ScriptLanguage, string> = {
  [ScriptLanguage.English]: 'The lines are spoken in English.',
  [ScriptLanguage.Filipino]:
    'The lines are spoken in Filipino (Tagalog), with natural Filipino pronunciation.',
  [ScriptLanguage.Taglish]:
    'The lines are spoken in natural Taglish, Filipino mixed with English the way Filipino friends talk, with natural Filipino pronunciation.',
};

/**
 * The order parts give way in over the limit, lowest first: the context
 * sentences are dropped whole, then the visual and the sound are shortened.
 * The shot lead, the close, the language, the lines and their beats stay.
 */
const GIVE = {
  situation: 1,
  mood: 2,
  props: 3,
  opening: 4,
  visual: 5,
  sound: 6,
} as const;

/** One sentence of a prompt, and how it gives way (never, when unset). */
type PromptPart = { text: string; give?: number; trim?: boolean };

export function clipPrompt(
  visual: string,
  direction?: ClipDirection,
  mode: SheetClipMode = SceneClipMode.FirstFrame,
  presenter?: string | null,
  audio?: ClipAudio,
  context?: ClipContext,
): string {
  const camera = hasBeatShots(audio)
    ? BEAT_CAMERA
    : mode === SceneClipMode.FirstLastFrame
      ? 'Smooth, steady camera move.'
      : 'Slow, steady camera.';
  // A named product is kept “as shown”, so the sentence reads for any name.
  const product = context?.product?.trim();
  const photos =
    mode === SceneClipMode.FirstFrame ? 'in the photo' : 'in the photos';
  const story = context?.story;

  return composePrompt([
    { text: shotLead(direction, presenter, story) },
    {
      text:
        mode === SceneClipMode.FirstLastFrame
          ? 'Starts on the first photo and ends on the second.'
          : '',
    },
    ...contextParts(direction, audio, context),
    {
      text: direction?.props?.trim()
        ? `Props: ${direction.props.trim().replace(/[.!?]+$/, '')}.`
        : '',
      give: GIVE.props,
    },
    { text: asSentence(visual), give: GIVE.visual, trim: true },
    {
      // A story has no product to keep, so only the camera closes it.
      text: story
        ? camera
        : mode === SceneClipMode.References
          ? `Show ${product ? `${product} exactly as ${photos}` : 'the product exactly as it looks in the photos'}. ${camera}`
          : `${camera} Keep ${product ? `${product} exactly as shown ${photos}` : 'the product exactly as it is'}.`,
    },
    ...audioParts(audio, context),
  ]);
}

/**
 * A one-click clip's description (Design Reference §5.16, One-click clips):
 * the scene's direction, then a close that names the Keep consistent items
 * it sends and, past the first scene, points at the still of the scene
 * before, which the server sends as the last reference image. A story's
 * photos are optional, so its `items` are only those with a photo, and with
 * none the close names nothing.
 */
export function oneClickClipPrompt(
  visual: string,
  direction: ClipDirection | undefined,
  presenter: string | null | undefined,
  items: string[],
  followsScene: boolean,
  audio?: ClipAudio,
  context?: ClipContext,
): string {
  const names = items.map((name) => name.trim()).filter(Boolean);
  const listed =
    names.length > 1
      ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
      : (names[0] ?? 'the product');
  const story = context?.story;

  // The Keep consistent items already name the scene's props.
  return composePrompt([
    { text: shotLead(direction, presenter, story) },
    ...contextParts(direction, audio, context),
    { text: asSentence(visual), give: GIVE.visual, trim: true },
    {
      text: [
        story
          ? names.length
            ? `Keep ${listed} looking the same as in the reference images.`
            : ''
          : `Keep ${listed} exactly as they look in the reference images.`,
        followsScene
          ? 'The last reference image is the scene before this one: match its light and setting.'
          : '',
        hasBeatShots(audio) ? BEAT_CAMERA : 'Slow, steady camera.',
      ]
        .filter(Boolean)
        .join(' '),
    },
    ...audioParts(audio, context),
  ]);
}

/**
 * The script's context for this scene: the skit's situation for a shot of
 * people (a hands or product shot leaves it out, so no one walks into the
 * frame), the tone the acting follows when people are seen or heard, and the
 * chosen hook's opening shot on the first scene.
 */
function contextParts(
  direction: ClipDirection | undefined,
  audio: ClipAudio | undefined,
  context: ClipContext | undefined,
): PromptPart[] {
  const onCamera = direction
    ? direction.inFrame === ShotSubject.Creator
    : spokenLines(audio).length > 0;
  const acted = onCamera || spokenLines(audio).length > 0;
  const scenario = context?.scenario?.trim();
  const opening = context?.openingShot?.trim();
  // A story's genre sets the mood; it has no tone of its own.
  const story = context?.story;
  const mood = story
    ? story.genre
      ? GENRE_MOOD[story.genre]
      : null
    : context?.tone
      ? TONE_MOOD[context.tone]
      : null;

  return [
    {
      text: onCamera && scenario ? `Situation: ${asSentence(scenario)}` : '',
      give: GIVE.situation,
    },
    {
      text: acted && mood ? `Mood: ${mood}.` : '',
      give: GIVE.mood,
    },
    {
      text: opening ? `Opening shot of the video: ${asSentence(opening)}` : '',
      give: GIVE.opening,
    },
  ];
}

/** The scene's sound, the language its lines are said in, the lines, then no music. */
function audioParts(
  audio: ClipAudio | undefined,
  context: ClipContext | undefined,
): PromptPart[] {
  const sound = audio?.sound?.trim()
    ? `Sound: ${audio.sound.trim().replace(/[.!?]+$/, '')}.`
    : '';
  const lines = beatsPrompt(audio);

  return [
    { text: sound, give: GIVE.sound, trim: true },
    {
      text: lines && context?.language ? SPOKEN_IN[context.language] : '',
    },
    { text: lines },
    { text: sound || lines ? 'No background music.' : '' },
  ];
}

/**
 * “Close-up, hands only, bus stop” from a scene's shot direction. A story's
 * shot of the cast names the characters in the scene with their looks,
 * “Medium, Ana (20s, yellow raincoat, short hair), bus stop”.
 */
function shotLead(
  direction: ClipDirection | undefined,
  presenter: string | null | undefined,
  story?: NonNullable<ClipContext>['story'],
): string {
  const cast = castOf(story?.characters ?? []);

  if (!direction) return cast ? `${cast}.` : '';

  const onCamera = direction.inFrame === ShotSubject.Creator;
  const lead = [
    SHOT_FRAMING_LABEL[direction.framing],
    onCamera && cast
      ? cast
      : onCamera && presenter?.trim()
        ? presenter.trim().replace(/[.!?]$/, '')
        : (story ? STORY_IN_FRAME_PROMPT : IN_FRAME_PROMPT)[direction.inFrame],
    direction.setting.trim(),
  ]
    .filter(Boolean)
    .join(', ');

  return lead ? `${lead}.` : '';
}

/** “Ana (20s, yellow raincoat, short hair) and Ben (20s, green rider jacket)”. */
function castOf(characters: ClipCharacter[]): string {
  const named = characters.flatMap((character) => {
    const name = character.name.trim();
    const look = character.look?.trim().replace(/[.!?]+$/, '');

    if (!name) return [];

    return [look ? `${name} (${look})` : name];
  });

  return named.length > 1
    ? `${named.slice(0, -1).join(', ')} and ${named.at(-1)}`
    : (named[0] ?? '');
}

/**
 * The parts in order, one space apart. Over the limit they give way in
 * `GIVE` order: context sentences are dropped whole, then the visual and the
 * sound are shortened; the rest (lines included) stays whole.
 */
function composePrompt(parts: PromptPart[]): string {
  const kept = parts.filter((part) => part.text).map((part) => ({ ...part }));
  const joined = () =>
    kept
      .map((part) => part.text)
      .filter(Boolean)
      .join(' ');
  const givers = kept
    .filter((part) => part.give !== undefined)
    .sort((a, b) => (a.give ?? 0) - (b.give ?? 0));

  for (const part of givers) {
    const over = joined().length - CLIP_PROMPT_MAX;
    if (over <= 0) break;
    part.text = part.trim
      ? part.text.slice(0, Math.max(0, part.text.length - over)).trim()
      : '';
  }

  return joined().slice(0, CLIP_PROMPT_MAX);
}

function asSentence(text: string): string {
  const trimmed = text.trim();
  return trimmed ? (/[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`) : '';
}

function spokenLines(audio?: ClipAudio): ClipLine[] {
  return (audio?.lines ?? []).filter((line) => line.text.trim());
}

function hasBeatShots(audio?: ClipAudio): boolean {
  return spokenLines(audio).some((line) => line.shot?.trim());
}

/**
 * A skit scene's lines acted as beats. Lines with no beat read as they
 * always have (`Ben says: "…"`). Directed lines add where the camera is,
 * the reaction before the line and the delivery, and when the scene is
 * timed each beat is a timecoded block (`[1 to 2.5 seconds] …`, the form the
 * video service follows), with the moment after the last line kept silent so
 * no one adds words. A double quote inside a line becomes `'`.
 */
function beatsPrompt(audio?: ClipAudio): string {
  const lines = spokenLines(audio);
  const seconds = audio?.seconds ?? 0;
  const timed = seconds > 0 && isTimed(lines);
  const beats = lineTimeline(lines, seconds);
  const directed = lines.some(
    (line) =>
      line.shot?.trim() ||
      line.reaction?.trim() ||
      line.delivery?.trim() ||
      snapPause(line.pauseSeconds ?? 0) > 0,
  );
  const span = (from: number, to: number) => {
    const [start, end] = roundedSpan(from, to);
    return `[${formatSeconds(start)} to ${formatSeconds(end)} seconds]`;
  };

  const cast = new Set(
    lines.map((line) => line.speaker.trim().toLowerCase()).filter(Boolean),
  );

  const parts = lines.flatMap((line, index) => {
    const speaker = line.speaker.trim() || 'Someone';
    const shot = asSentence(capitalize(line.shot?.trim() ?? ''));
    const reaction = line.reaction?.trim()
      ? reactionOf(speaker, line.reaction.trim(), cast)
      : '';
    const delivery = line.delivery?.trim();
    // “, half laughing, says: "…"”, after the speaker or after their reaction.
    const saying = `${delivery ? `, ${delivery},` : ''} says: "${line.text.trim().replace(/"/g, "'")}"`;
    const beat = beats[index];

    if (timed && beat.speakSeconds > beat.startSeconds) {
      return [
        `${span(beat.startSeconds, beat.speakSeconds)} ${[shot, reaction ? `${reaction}.` : 'A quiet beat.'].filter(Boolean).join(' ')}`,
        `${span(beat.speakSeconds, beat.endSeconds)} ${speaker}${saying}`,
      ];
    }

    const act = [
      shot,
      reaction ? `${reaction}, then${saying}` : `${speaker}${saying}`,
    ]
      .filter(Boolean)
      .join(' ');

    return [timed ? `${span(beat.startSeconds, beat.endSeconds)} ${act}` : act];
  });

  const last = beats.at(-1);
  if (timed && last && seconds - last.endSeconds >= 0.5) {
    parts.push(
      `${span(last.endSeconds, seconds)} No one speaks; they react as the moment lands.`,
    );
  }
  if (directed) {
    parts.push(
      'Natural acting, never theatrical: each person listens and reacts before answering, and no one talks over another.',
    );
  }

  return parts.join(' ');
}

/**
 * “Ben stops and looks down”: the reaction led by who does it, once. A
 * reaction that already starts with a name from the cast keeps it as written.
 */
function reactionOf(
  speaker: string,
  reaction: string,
  cast: Set<string>,
): string {
  const text = reaction.replace(/[.!?]+$/, '');
  const first = (text.match(/^[\p{L}\p{N}-]+/u)?.[0] ?? '').toLowerCase();

  return first === speaker.toLowerCase() || cast.has(first)
    ? capitalize(text)
    : `${speaker} ${lowerFirst(text)}`;
}

function capitalize(text: string): string {
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : '';
}

function lowerFirst(text: string): string {
  return text ? `${text[0].toLowerCase()}${text.slice(1)}` : '';
}
