import { CaptionStyle } from 'src/graphql/generated/graphql';
import { RENDER_HEIGHT, RENDER_WIDTH, type RenderPlan } from './render.types';

/**
 * The subtitle script libass burns into the video: on-screen text, text
 * cards, captions in the chosen style and the end card. Sizes follow the
 * Design Reference preview frame (328px wide) scaled to 1080px.
 */

const SCALE = RENDER_WIDTH / 328;
const px = (value: number) => Math.round(value * SCALE);
/** ASS colours are &HAABBGGRR; alpha 00 is opaque. 0x47 ≈ 72% opaque. */
const WHITE = '&H00FFFFFF';
const BOX = '&H47000000';
const SHADOW = '&H66000000';
const STAGE_INK = '&H00F7F2F3';
const STAGE_INK_2 = '&H00B4A7A9';
const STAGE_FLARE = '&H005C7AFF';
const SIDE_MARGIN = Math.round(RENDER_WIDTH * 0.07);

const STYLE_FORMAT =
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding';

function style(
  name: string,
  size: number,
  colour: string,
  weight: number,
  box: boolean,
  shadow: number,
  alignment: number,
  marginV: number,
): string {
  // BorderStyle 3 draws an opaque box (in OutlineColour) behind the text.
  return `Style: ${name},Geist,${size},${colour},${colour},${box ? BOX : SHADOW},${box ? BOX : SHADOW},${weight},0,0,0,100,100,0,0,${box ? 3 : 1},${box ? px(2.5) : 0},${shadow},${alignment},${SIDE_MARGIN},${SIDE_MARGIN},${marginV},1`;
}

export function buildAss(plan: RenderPlan): string {
  const events: string[] = [];
  const add = (
    startMs: number,
    endMs: number,
    styleName: string,
    text: string,
  ) => {
    if (endMs > startMs && text) {
      events.push(
        `Dialogue: 0,${time(startMs)},${time(endMs)},${styleName},,0,0,0,,${text}`,
      );
    }
  };
  let startMs = 0;

  for (const scene of plan.scenes) {
    const endMs = startMs + scene.durationMs;

    add(
      startMs,
      endMs,
      scene.kind === 'text' ? 'TextCard' : 'OnScreen',
      escape(scene.onScreenText),
    );
    startMs = endMs;
  }

  if (plan.captions.enabled) {
    for (const line of plan.captions.lines) {
      if (
        plan.captions.style === CaptionStyle.WORD_HIGHLIGHT &&
        line.words.length
      ) {
        addHighlighted(add, line);
      } else {
        add(
          line.startMs,
          line.endMs,
          plan.captions.style === CaptionStyle.BOXED
            ? 'CaptionBoxed'
            : 'Caption',
          escape(line.text),
        );
      }
    }
  }

  if (plan.endCard) {
    const endMs = startMs + plan.endCard.durationMs;
    add(
      startMs,
      endMs,
      'EndTitle',
      `{\\an5\\pos(${RENDER_WIDTH / 2},${RENDER_HEIGHT / 2 - px(14)})}${escape(plan.endCard.title)}`,
    );
    if (plan.endCard.cta) {
      add(
        startMs,
        endMs,
        'EndCta',
        `{\\an5\\pos(${RENDER_WIDTH / 2},${RENDER_HEIGHT / 2 + px(14)})}${escape(plan.endCard.cta)}`,
      );
    }
  }

  return [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${RENDER_WIDTH}`,
    `PlayResY: ${RENDER_HEIGHT}`,
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    STYLE_FORMAT,
    style(
      'OnScreen',
      px(20),
      WHITE,
      700,
      true,
      0,
      8,
      Math.round(RENDER_HEIGHT * 0.14),
    ),
    style('TextCard', px(20), WHITE, 700, false, 0, 5, 0),
    style(
      'Caption',
      px(17),
      WHITE,
      600,
      false,
      2,
      2,
      Math.round(RENDER_HEIGHT * 0.22),
    ),
    style(
      'CaptionBoxed',
      px(17),
      WHITE,
      600,
      true,
      0,
      2,
      Math.round(RENDER_HEIGHT * 0.22),
    ),
    style('EndTitle', px(18), STAGE_INK, 600, false, 0, 5, 0),
    style('EndCta', px(13), STAGE_INK_2, 600, false, 0, 5, 0),
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ...events,
    '',
  ].join('\n');
}

/** One event per spoken word, with only that word in the flare colour. */
function addHighlighted(
  add: (startMs: number, endMs: number, style: string, text: string) => void,
  line: RenderPlan['captions']['lines'][number],
) {
  const rows = line.text.split('\n');
  const words = rows.flatMap((row, rowIndex) =>
    row
      .split(/\s+/)
      .filter(Boolean)
      .map((word, index) => ({ word, rowIndex, first: index === 0 })),
  );
  const render = (active: number) =>
    words
      .map(({ word, rowIndex, first }, index) => {
        const prefix = first ? (rowIndex > 0 ? '\\N' : '') : ' ';
        const text = escape(word);
        return index === active
          ? `${prefix}{\\c${STAGE_FLARE}}${text}{\\c${WHITE}}`
          : `${prefix}${text}`;
      })
      .join('');
  let cursor = line.startMs;

  line.words.forEach((word, index) => {
    const from = Math.max(cursor, word.startMs);
    const to = line.words[index + 1]?.startMs ?? line.endMs;

    if (from > cursor) add(cursor, from, 'Caption', render(-1));
    add(from, Math.min(to, line.endMs), 'Caption', render(index));
    cursor = Math.min(to, line.endMs);
  });
  if (cursor < line.endMs) add(cursor, line.endMs, 'Caption', render(-1));
}

/** Plain text for an ASS event: no override blocks, newlines as \N. */
export function escape(text: string): string {
  return text
    .replace(/\\/g, '∖')
    .replace(/\{/g, '(')
    .replace(/\}/g, ')')
    .replace(/\r?\n/g, '\\N');
}

/** h:mm:ss.cc */
export function time(ms: number): string {
  const centis = Math.max(0, Math.round(ms / 10));
  const hours = Math.floor(centis / 360000);
  const minutes = Math.floor((centis % 360000) / 6000);
  const seconds = Math.floor((centis % 6000) / 100);
  const rest = centis % 100;

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(rest).padStart(2, '0')}`;
}
