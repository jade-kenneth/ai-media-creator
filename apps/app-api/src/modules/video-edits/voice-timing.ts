import { lineTimeline } from '../scripts/script-writing';

/**
 * Pure timing helpers for voiceovers and captions (Product Specification
 * §3.14). Times are milliseconds from the start of the scene unless noted.
 */

export interface TimedWord {
  text: string;
  startMs: number;
  endMs: number;
}

export interface PronunciationRule {
  word: string;
  sayAs: string;
}

export interface CaptionDraft {
  startMs: number;
  endMs: number;
  /** Up to two lines joined with a newline. */
  text: string;
  words: TimedWord[];
}

export const CAPTION_LINE_CHARS = 32;
export const CAPTION_MAX_LINES = 2;
export const CAPTION_MIN_MS = 800;
/** Share of script words a recording must match, in order, to be timed. */
export const MIN_ALIGNED_SHARE = 0.9;

export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Lower-case letters and digits only, for comparing spoken and written words. */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * The text sent to the voice: each script word that matches a rule is spoken
 * as its “say it like” spelling, keeping surrounding punctuation. `source`
 * maps every spoken word back to the script word it came from, so timings
 * land on the words the creator wrote.
 */
export function applyPronunciations(
  narration: string,
  rules: PronunciationRule[],
): { spoken: string; source: number[] } {
  const byWord = new Map(
    rules.map((rule) => [normalizeWord(rule.word), rule.sayAs.trim()]),
  );
  const spokenWords: string[] = [];
  const source: number[] = [];

  tokenize(narration).forEach((token, index) => {
    const sayAs = byWord.get(normalizeWord(token));
    const replaced = sayAs
      ? token.replace(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/u, sayAs)
      : token;

    for (const part of tokenize(replaced)) {
      spokenWords.push(part);
      source.push(index);
    }
  });

  return { spoken: spokenWords.join(' '), source };
}

/** Groups per-character timing (seconds) into words split on whitespace. */
export function wordsFromCharacters(
  characters: { text: string; start: number; end: number }[],
): TimedWord[] {
  const words: TimedWord[] = [];
  let current: TimedWord | null = null;

  for (const character of characters) {
    if (/^\s*$/.test(character.text)) {
      current = null;
      continue;
    }

    const startMs = Math.round(character.start * 1000);
    const endMs = Math.round(character.end * 1000);

    if (!current) {
      current = { text: character.text, startMs, endMs };
      words.push(current);
    } else {
      current.text += character.text;
      current.endMs = endMs;
    }
  }

  return words;
}

/**
 * Timings for the script's words from the spoken words (pronunciations can
 * turn one word into several). Falls back to spreading the scene evenly when
 * the provider's word count doesn't line up.
 */
export function scriptWordTimings(
  narration: string,
  spoken: TimedWord[],
  source: number[],
  durationMs: number,
): TimedWord[] {
  const tokens = tokenize(narration);

  if (spoken.length !== source.length) return spreadEvenly(tokens, durationMs);

  return tokens.map((text, index) => {
    const parts = spoken.filter(
      (_, spokenIndex) => source[spokenIndex] === index,
    );

    return parts.length
      ? {
          text,
          startMs: Math.min(...parts.map((part) => part.startMs)),
          endMs: Math.max(...parts.map((part) => part.endMs)),
        }
      : { text, startMs: 0, endMs: 0 };
  });
}

/**
 * Matches aligned words (a recording) to the script's words in order. Returns
 * null when too few match, or times run backwards: the recording doesn't
 * follow the script closely enough to time it.
 */
export function matchAlignedWords(
  tokens: string[],
  aligned: { text: string; start: number; end: number }[],
): TimedWord[] | null {
  const matched: (TimedWord | null)[] = tokens.map(() => null);
  let cursor = 0;

  tokens.forEach((token, index) => {
    const target = normalizeWord(token);
    if (!target) return;

    for (
      let look = cursor;
      look < Math.min(aligned.length, cursor + 4);
      look += 1
    ) {
      if (normalizeWord(aligned[look].text) === target) {
        matched[index] = {
          text: token,
          startMs: Math.round(aligned[look].start * 1000),
          endMs: Math.round(aligned[look].end * 1000),
        };
        cursor = look + 1;
        return;
      }
    }
  });

  const countable = tokens.filter((token) => normalizeWord(token)).length;
  const found = matched.filter(Boolean) as TimedWord[];

  if (!countable || found.length / countable < MIN_ALIGNED_SHARE) return null;
  if (
    found.some(
      (word, index) => index > 0 && word.startMs < found[index - 1].startMs,
    )
  ) {
    return null;
  }

  // Words the aligner skipped take their neighbours' times.
  return matched.map((word, index) => {
    if (word) return word;
    const before = matched.slice(0, index).reverse().find(Boolean);
    const after = matched.slice(index + 1).find(Boolean);
    const at = before?.endMs ?? after?.startMs ?? 0;

    return { text: tokens[index], startMs: at, endMs: after?.startMs ?? at };
  });
}

/**
 * Captions for one scene: lines break at sentence ends and before a caption
 * would need more than two lines of 32 characters; very short captions merge
 * into the next when they fit, so none flashes by in under 0.8 s.
 */
export function buildSceneCaptions(
  words: TimedWord[],
  sceneMs: number,
): CaptionDraft[] {
  const groups: TimedWord[][] = [];
  let current: TimedWord[] = [];

  for (const word of words) {
    const candidate = [...current, word];

    if (
      current.length &&
      wrap(candidate.map((item) => item.text).join(' ')).length >
        CAPTION_MAX_LINES
    ) {
      groups.push(current);
      current = [word];
    } else {
      current = candidate;
    }

    if (/[.!?…]["”’)]*$/.test(word.text)) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);

  const merged: TimedWord[][] = [];

  for (const group of groups) {
    const previous = merged[merged.length - 1];
    const span = (items: TimedWord[]) =>
      items[items.length - 1].endMs - items[0].startMs;

    if (
      previous &&
      span(previous) < CAPTION_MIN_MS &&
      wrap([...previous, ...group].map((item) => item.text).join(' ')).length <=
        CAPTION_MAX_LINES
    ) {
      merged[merged.length - 1] = [...previous, ...group];
    } else {
      merged.push(group);
    }
  }

  return merged.map((group, index) => {
    const next = merged[index + 1];
    const startMs = index === 0 ? 0 : group[0].startMs;
    // Captions hold until the next one starts; the last holds to the scene end.
    const endMs = next
      ? next[0].startMs
      : Math.max(sceneMs, group[group.length - 1].endMs);

    return {
      startMs,
      endMs: Math.max(endMs, startMs + 1),
      text: wrap(group.map((word) => word.text).join(' ')).join('\n'),
      words: group,
    };
  });
}

/**
 * Captions for a scene that plays its clip's own sound: each spoken line in
 * turn, on the script's line timeline (`lineTimeline`), its words spread
 * evenly over the time they're said, so Word highlight still steps through
 * them. Lines without pauses share the scene by word count; a timed line's
 * caption appears once its reaction has played, when the words start, and
 * holds until the next line's words. The timing follows the script, not the
 * clip's audio.
 */
export function spokenCaptions(
  texts: string[],
  sceneMs: number,
  pausesSeconds: number[] = [],
): CaptionDraft[] {
  const spoken = texts
    .map((text, index) => ({
      tokens: tokenize(text),
      pauseSeconds: pausesSeconds[index] ?? 0,
    }))
    .filter((line) => line.tokens.length);
  const beats = lineTimeline(
    spoken.map((line) => ({
      text: line.tokens.join(' '),
      pauseSeconds: line.pauseSeconds,
    })),
    sceneMs / 1000,
  );
  const drafts: CaptionDraft[] = [];

  spoken.forEach(({ tokens }, index) => {
    const speakMs = beats[index].speakSeconds * 1000;
    const saidMs = beats[index].endSeconds * 1000 - speakMs;
    const next = beats[index + 1];
    const spanMs = (next ? next.speakSeconds * 1000 : sceneMs) - speakMs;
    const shift = (ms: number) => Math.round(speakMs + ms);

    // Built per line, so a caption never runs one speaker into the next.
    for (const draft of buildSceneCaptions(
      spreadEvenly(tokens, saidMs),
      spanMs,
    )) {
      drafts.push({
        startMs: shift(draft.startMs),
        endMs: shift(draft.endMs),
        text: draft.text,
        words: draft.words.map((word) => ({
          text: word.text,
          startMs: shift(word.startMs),
          endMs: shift(word.endMs),
        })),
      });
    }
  });

  return drafts;
}

/** Captions without a voiceover: the scene's on-screen text for the whole scene. */
export function textCaptions(
  onScreenText: string,
  sceneMs: number,
): CaptionDraft[] {
  const text = onScreenText.trim();

  return text
    ? [
        {
          startMs: 0,
          endMs: sceneMs,
          text: wrap(text).slice(0, CAPTION_MAX_LINES).join('\n'),
          words: [],
        },
      ]
    : [];
}

/** Greedy wrap at 32 characters; a single longer word keeps its own line. */
export function wrap(text: string): string[] {
  const lines: string[] = [];
  let line = '';

  for (const word of tokenize(text)) {
    if (!line) {
      line = word;
    } else if (`${line} ${word}`.length <= CAPTION_LINE_CHARS) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  return lines;
}

function spreadEvenly(tokens: string[], durationMs: number): TimedWord[] {
  const step = tokens.length ? durationMs / tokens.length : 0;

  return tokens.map((text, index) => ({
    text,
    startMs: Math.round(index * step),
    endMs: Math.round((index + 1) * step),
  }));
}
