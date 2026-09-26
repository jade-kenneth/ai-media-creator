/** Mirrors the API (`script-writing.ts`): about 2.5 spoken words per second. */
const WORDS_PER_SECOND = 2.5;
const MIN_SCENE_SECONDS = 2;
const MAX_SCENE_SECONDS = 15;
/** The longest a skit line's reaction holds before its words (the API's limit). */
export const MAX_PAUSE_SECONDS = 3;

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Everything said out loud in a scene: the narration and, in a skit, every
 * line. Scene lengths and the spoken-length estimate measure this.
 */
export function spokenText(scene: {
  narration: string;
  lines?: { text: string }[] | null;
}) {
  return [scene.narration, ...(scene.lines ?? []).map((line) => line.text)]
    .filter(Boolean)
    .join(' ');
}

export function spokenSeconds(texts: string[]) {
  return Math.round(wordCount(texts.join(' ')) / WORDS_PER_SECOND);
}

/** A reaction's hold in seconds: 0 to 3, to the nearest half second. */
export function snapPause(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.min(MAX_PAUSE_SECONDS, Math.max(0, Math.round(value * 2) / 2));
}

/** Every reaction hold in a skit scene's lines, together; blank lines hold none. */
export function linePauses(scene: {
  lines?: { text: string; pauseSeconds?: number | null }[] | null;
}) {
  return (scene.lines ?? [])
    .filter((line) => line.text.trim())
    .reduce((sum, line) => sum + snapPause(line.pauseSeconds ?? 0), 0);
}

/** Whole seconds a scene's spoken words, and any reaction holds, take. */
function sayingSeconds(spoken: string, pauses: number) {
  return Math.ceil(wordCount(spoken) / WORDS_PER_SECOND + pauses);
}

/**
 * The shortest a scene can be: long enough to say what's spoken, after
 * every reaction's hold in a skit, 2 to 15 s.
 */
export function minSceneSeconds(spoken: string, pauses = 0) {
  return Math.min(
    MAX_SCENE_SECONDS,
    Math.max(MIN_SCENE_SECONDS, sayingSeconds(spoken, pauses)),
  );
}

/** A scene grows to fit longer spoken words and never shrinks with shorter ones. */
export function fitSceneSeconds(
  durationSeconds: number,
  spoken: string,
  pauses = 0,
) {
  return Math.min(
    MAX_SCENE_SECONDS,
    Math.max(durationSeconds, minSceneSeconds(spoken, pauses)),
  );
}

/** When one line plays in its scene, in seconds from the scene's start. */
export type LineBeat = {
  /** The reaction starts (the camera is on the beat's shot). */
  startSeconds: number;
  /** The first word is said. */
  speakSeconds: number;
  /** The last word ends. */
  endSeconds: number;
};

/**
 * Mirrors the API's `lineTimeline`: the one timeline a skit scene's lines
 * follow in the brief, the clip description and the captions. With any
 * pause, each line waits out its reaction and is said at about 2.5 words per
 * second, and the rest of the scene follows the last line; a scene shorter
 * than that squeezes every beat evenly. Lines with no pause at all share the
 * scene by word count.
 */
export function lineTimeline(
  lines: { text: string; pauseSeconds?: number | null }[],
  sceneSeconds: number,
): LineBeat[] {
  const counts = lines.map((line) => wordCount(line.text));
  const pauses = lines.map((line) => snapPause(line.pauseSeconds ?? 0));
  const words = counts.reduce((sum, count) => sum + count, 0);
  let cursor = 0;

  if (!pauses.some(Boolean)) {
    return counts.map((count) => {
      const start = cursor;
      cursor += words ? (sceneSeconds * count) / words : 0;
      return { startSeconds: start, speakSeconds: start, endSeconds: cursor };
    });
  }

  const natural =
    pauses.reduce((sum, pause) => sum + pause, 0) + words / WORDS_PER_SECOND;
  const scale = natural > sceneSeconds ? sceneSeconds / natural : 1;

  return counts.map((count, index) => {
    const start = cursor;
    const speak = start + pauses[index] * scale;
    cursor = speak + (count / WORDS_PER_SECOND) * scale;
    return { startSeconds: start, speakSeconds: speak, endSeconds: cursor };
  });
}

/** A scene's lines are timed once any of them holds a reaction before it. */
export function isTimed(lines: { pauseSeconds?: number | null }[]) {
  return lines.some((line) => snapPause(line.pauseSeconds ?? 0) > 0);
}

/** Seconds to the nearest half: `2`, `2.5`. */
export function formatSeconds(value: number) {
  return String(Math.round(value * 2) / 2);
}

/** `[from, to]` to the nearest half second; a span too short to show reads 0.5 s. */
export function roundedSpan(start: number, end: number): [number, number] {
  const from = Math.round(start * 2) / 2;
  return [from, Math.max(Math.round(end * 2) / 2, from + 0.5)];
}
