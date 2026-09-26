'use client';

import { PlusIcon, XIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGE_LABEL } from '@/lib/studio/labels';
import { ScriptLanguage } from '@/react-query/generated__types';

import {
  formatSeconds,
  isTimed,
  lineTimeline,
  MAX_PAUSE_SECONDS,
  roundedSpan,
  type LineBeat,
} from './spoken-length';

/** The most lines one skit scene holds (the API's limit). */
const MAX_LINES = 3;
/** The API's limits on a line's beat directions. */
const SHOT_MAX = 60;
const REACTION_MAX = 80;
const DELIVERY_MAX = 60;
/** A reaction holds 0 to 3 s, in steps of half a second. */
const PAUSES = Array.from(
  { length: MAX_PAUSE_SECONDS * 2 + 1 },
  (_, step) => step / 2,
);

/**
 * A line and its beat: where the camera is, what the speaker does before
 * the line and for how long, and how they say it.
 */
export type SceneLine = {
  speaker: string;
  text: string;
  shot: string;
  reaction: string;
  pauseSeconds: number;
  delivery: string;
};

const BLANK_LINE: SceneLine = {
  speaker: '',
  text: '',
  shot: '',
  reaction: '',
  pauseSeconds: 0,
  delivery: '',
};

/**
 * A skit scene's spoken lines and natural sound (Product Specification
 * §3.22): who says what on camera, each line acted as a beat, and what the
 * action sounds like. A blank row stays on screen but isn't saved until it
 * has words. Once a line has a pause, every line shows when it's said.
 */
export function SceneLines({
  id,
  lines,
  sound,
  durationSeconds,
  language,
  readOnly,
  disabled,
  describedBy,
  onLines,
  onSound,
}: {
  id: string;
  lines: SceneLine[];
  sound: string;
  /** The scene's length, which the lines' timing is placed in. */
  durationSeconds: number;
  language: ScriptLanguage;
  readOnly: boolean;
  disabled: boolean;
  /** The scene's claim flags, which a line can raise. */
  describedBy?: string;
  onLines: (lines: SceneLine[]) => void;
  onSound: (sound: string) => void;
}) {
  const lang = language === ScriptLanguage.Filipino ? 'fil' : 'en';
  const setLine = (index: number, patch: Partial<SceneLine>) =>
    onLines(
      lines.map((line, at) => (at === index ? { ...line, ...patch } : line)),
    );
  const beats = beatsFor(lines, durationSeconds);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="t-label">Lines</span>
          <Badge dot={false}>{LANGUAGE_LABEL[language]}</Badge>
        </div>
        {readOnly ? (
          lines.length > 0 ? (
            <LineBeats
              lines={lines}
              durationSeconds={durationSeconds}
              lang={lang}
            />
          ) : (
            <p className="t-sm text-ink-2">No one speaks in this scene.</p>
          )
        ) : (
          <>
            <span className="t-caption text-ink-3">
              Give answers a beat: a reaction and a pause before the line make
              it play like a real moment.
            </span>
            {lines.map((line, index) => {
              const lineId = `${id}-line-${index}`;
              const beat = beats[index];

              return (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-md border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="t-mono text-caption text-ink-3">
                      Line {index + 1}
                      {beat ? ` · ${spanLabel(beat)}` : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ml-auto"
                      disabled={disabled}
                      aria-label={`Remove line ${index + 1}`}
                      onClick={() =>
                        onLines(lines.filter((_, at) => at !== index))
                      }
                    >
                      <XIcon />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label={`Who says line ${index + 1}`}
                      placeholder="Name"
                      maxLength={24}
                      value={line.speaker}
                      disabled={disabled}
                      className="w-28 shrink-0"
                      onChange={(event) =>
                        setLine(index, { speaker: event.target.value })
                      }
                    />
                    <Input
                      aria-label={`Line ${index + 1}${line.speaker ? `, said by ${line.speaker}` : ''}`}
                      placeholder="What they say out loud"
                      maxLength={160}
                      value={line.text}
                      disabled={disabled}
                      lang={lang}
                      aria-describedby={describedBy}
                      className="min-w-0 flex-1"
                      onChange={(event) =>
                        setLine(index, { text: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label
                        htmlFor={`${lineId}-reaction`}
                        className="t-sm text-ink-2"
                      >
                        Reaction before the line
                      </label>
                      <Input
                        id={`${lineId}-reaction`}
                        placeholder="e.g. Stops, looks at the sandals, then back up"
                        maxLength={REACTION_MAX}
                        value={line.reaction}
                        disabled={disabled}
                        onChange={(event) =>
                          setLine(index, { reaction: event.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`${lineId}-pause`}
                        className="t-sm text-ink-2"
                      >
                        Pause before speaking
                      </label>
                      <Select
                        value={String(line.pauseSeconds)}
                        disabled={disabled}
                        onValueChange={(value) =>
                          setLine(index, { pauseSeconds: Number(value) })
                        }
                      >
                        <SelectTrigger
                          id={`${lineId}-pause`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectGroup>
                            {PAUSES.map((pause) => (
                              <SelectItem key={pause} value={String(pause)}>
                                {pause
                                  ? `${formatSeconds(pause)} s`
                                  : 'No pause'}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`${lineId}-delivery`}
                        className="t-sm text-ink-2"
                      >
                        Face and voice
                      </label>
                      <Input
                        id={`${lineId}-delivery`}
                        placeholder="e.g. Half laughing, eyebrows up"
                        maxLength={DELIVERY_MAX}
                        value={line.delivery}
                        disabled={disabled}
                        onChange={(event) =>
                          setLine(index, { delivery: event.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={`${lineId}-shot`}
                        className="t-sm text-ink-2"
                      >
                        Camera
                      </label>
                      <Input
                        id={`${lineId}-shot`}
                        placeholder="e.g. Close-up on Ben"
                        maxLength={SHOT_MAX}
                        value={line.shot}
                        disabled={disabled}
                        onChange={(event) =>
                          setLine(index, { shot: event.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {lines.length === 0 ? (
              <p className="t-sm text-ink-3">
                No one speaks yet. The scene plays its natural sound.
              </p>
            ) : null}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled || lines.length >= MAX_LINES}
                onClick={() => onLines([...lines, BLANK_LINE])}
              >
                <PlusIcon data-icon="inline-start" />
                Add line
              </Button>
              <span className="t-mono text-caption text-ink-3">
                {lines.length} of {MAX_LINES}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-sound`} className="t-label">
          Sound
        </label>
        {readOnly ? (
          <p id={`${id}-sound`} className="t-body">
            {sound || '—'}
          </p>
        ) : (
          <>
            <Input
              id={`${id}-sound`}
              maxLength={80}
              placeholder="e.g. Sandals slapping on the pavement"
              value={sound}
              disabled={disabled}
              aria-describedby={`${id}-sound-hint`}
              onChange={(event) => onSound(event.target.value)}
            />
            <span id={`${id}-sound-hint`} className="t-caption text-ink-3">
              The natural sound the action makes. Record it with the scene.
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A skit scene's lines as they play, read-only: each line with its time once
 * the scene is timed, who says it and how, then the reaction before it and
 * where the camera is. Script Studio and the Media step show the same view.
 */
export function LineBeats({
  lines,
  durationSeconds,
  lang,
  size = 'body',
}: {
  lines: SceneLine[];
  /** The scene's length, which the lines' timing is placed in. */
  durationSeconds: number;
  /** The script's language, for the words; unset when it isn't known. */
  lang?: string;
  /** `sm` sets the line in the smaller text of a summary row. */
  size?: 'body' | 'sm';
}) {
  const beats = beatsFor(lines, durationSeconds);

  return lines.map((line, index) => (
    <ReadOnlyLine
      key={index}
      line={line}
      beat={beats[index]}
      lang={lang}
      size={size}
    />
  ));
}

/** `Ben (half laughing): “…”`, with its time, and the reaction and camera under it. */
function ReadOnlyLine({
  line,
  beat,
  lang,
  size,
}: {
  line: SceneLine;
  beat: LineBeat | undefined;
  lang?: string;
  size: 'body' | 'sm';
}) {
  const before = line.reaction || (line.pauseSeconds ? 'A quiet beat' : '');
  const notes = [
    before
      ? `Before: ${before}${line.pauseSeconds ? ` (${formatSeconds(line.pauseSeconds)} s)` : ''}`
      : '',
    line.shot ? `Camera: ${line.shot}` : '',
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-0.5">
      <p className={size === 'sm' ? 't-sm text-ink' : 't-body'}>
        {beat ? (
          <span className="t-mono text-ink-3">{spanLabel(beat)} </span>
        ) : null}
        {line.speaker ? (
          <span className="font-semibold">{line.speaker}</span>
        ) : null}
        {line.delivery ? (
          <span className="text-ink-2"> ({line.delivery})</span>
        ) : null}
        {line.speaker || line.delivery ? ': ' : null}
        <span lang={lang}>“{line.text}”</span>
      </p>
      {notes.length > 0 ? (
        <p className="t-sm text-ink-2">{notes.join(' · ')}</p>
      ) : null}
    </div>
  );
}

/**
 * Each line's time in the scene, by row, once the scene is timed (any line
 * with words has a pause). Blank rows aren't saved, so they get none.
 */
function beatsFor(
  lines: SceneLine[],
  durationSeconds: number,
): (LineBeat | undefined)[] {
  const spoken = lines.filter((line) => line.text.trim());

  if (!isTimed(spoken)) return lines.map(() => undefined);

  const timeline = lineTimeline(spoken, durationSeconds);
  let at = 0;

  return lines.map((line) => (line.text.trim() ? timeline[at++] : undefined));
}

/** When the line's words are said: `1–2.5 s`. */
function spanLabel(beat: LineBeat): string {
  const [from, to] = roundedSpan(beat.speakSeconds, beat.endSeconds);
  return `${formatSeconds(from)}–${formatSeconds(to)} s`;
}
