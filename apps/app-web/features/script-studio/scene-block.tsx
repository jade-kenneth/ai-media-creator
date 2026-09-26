'use client';

import { useId } from 'react';

import { ClaimFlagCallout } from '@/components/studio/claim-flag-callout';
import { FieldError } from '@/components/studio/field-label';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonCost } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  CREDIT_COST,
  LANGUAGE_LABEL,
  SCENE_PURPOSE_LABEL,
  SCENE_TRANSITION_HINT,
  SCENE_TRANSITION_LABEL,
  SHOT_FRAMING_LABEL,
} from '@/lib/studio/labels';
import {
  ClaimFlagCategory,
  ScenePurpose,
  SceneTransition,
  ScriptLanguage,
  ShotFraming,
  ShotSubject,
} from '@/react-query/generated__types';
import type {
  ClaimFlag,
  ScriptScene,
} from '@/react-query/scripts/scripts-operations';
import { formatTimecode } from '@/utils/date';

import { SceneLines } from './scene-lines';

type SceneValues = Pick<
  ScriptScene,
  | 'id'
  | 'order'
  | 'purpose'
  | 'durationSeconds'
  | 'narration'
  | 'lines'
  | 'sound'
  | 'onScreenText'
  | 'visual'
  | 'direction'
  | 'transitionIn'
  | 'cta'
  | 'factIds'
>;
type Direction = NonNullable<ScriptScene['direction']>;

/** A version written before shot direction existed starts from this, as the API does. */
const EMPTY_DIRECTION: Direction = {
  inFrame: ShotSubject.ProductOnly,
  framing: ShotFraming.Medium,
  setting: '',
  props: '',
};

export function SceneBlock({
  scene,
  index,
  start,
  flags,
  facts,
  language,
  skit,
  claims,
  shotSubjectLabel,
  readOnly,
  disabled,
  rewriting,
  rewriteFailed,
  minSeconds,
  durationError,
  opensWithHook = false,
  closingNote = null,
  onChange,
  onTransition,
  onRewrite,
  onAddFact,
}: {
  scene: SceneValues;
  index: number;
  start: number;
  flags: ClaimFlag[];
  facts: Map<string, string>;
  language: ScriptLanguage;
  /** A skit scene has spoken lines and a sound cue in place of narration. */
  skit: boolean;
  /** The studio checks claims: the scene shows the facts it uses (§3.23). */
  claims: boolean;
  /** The studio's In frame labels (§3.23). */
  shotSubjectLabel: Record<ShotSubject, string>;
  readOnly: boolean;
  disabled: boolean;
  rewriting: boolean;
  rewriteFailed: boolean;
  /** The shortest this scene can be and still fit what's said in it. */
  minSeconds: number;
  durationError: boolean;
  /** Scene 1 of a draft with a hook picked: its opening follows that hook. */
  opensWithHook?: boolean;
  /** A draft's last scene: the studio's note on how it ends (a story's cliffhanger, R29). */
  closingNote?: string | null;
  onChange: (patch: Partial<Omit<SceneValues, 'id'>>) => void;
  onTransition: (transition: SceneTransition) => void;
  onRewrite: () => void;
  onAddFact: (claim: string) => void;
}) {
  const id = useId();
  const end = start + scene.durationSeconds;
  const flagId = `${id}-flags`;
  const direction = scene.direction ?? EMPTY_DIRECTION;
  const transitionIn = scene.transitionIn ?? SceneTransition.Cut;
  const transitionSuffix =
    index > 0 &&
    scene.transitionIn &&
    scene.transitionIn !== SceneTransition.Cut
      ? scene.transitionIn === SceneTransition.Whip
        ? 'Whip in'
        : scene.transitionIn === SceneTransition.Dissolve
          ? 'Dissolve in'
          : 'Punch-in'
      : null;
  const setDirection = (patch: Partial<Direction>) =>
    onChange({ direction: { ...direction, ...patch } });
  // In a skit anyone from the cast is on camera, not only the creator.
  const inFrameLabel = (value: ShotSubject) =>
    skit && value === ShotSubject.Creator
      ? 'Cast on camera'
      : shotSubjectLabel[value];
  // A skit's pauses count toward how long its lines take.
  const spoken = skit
    ? scene.lines.some((line) => line.pauseSeconds > 0)
      ? 'lines and pauses'
      : 'lines'
    : 'narration';

  return (
    <li
      id={`scene-${index + 1}`}
      className={cn(
        'overflow-hidden rounded-lg border bg-surface',
        flags.length > 0 ? 'border-warning-border' : 'border-border',
      )}
    >
      <div className="flex flex-wrap items-center gap-3 bg-canvas px-4 py-2.5">
        <span className="t-mono flex size-7 items-center justify-center rounded-sm bg-ink text-white">
          {index + 1}
        </span>
        <h3 className="t-h3">{SCENE_PURPOSE_LABEL[scene.purpose]}</h3>
        <span className="t-mono text-ink-2">
          {formatTimecode(start)}–{formatTimecode(end)}
        </span>
        {readOnly ? (
          <span className="t-mono text-ink-2">{scene.durationSeconds} s</span>
        ) : (
          <label className="flex items-center gap-1.5">
            <span className="sr-only">
              Duration of scene {index + 1} in seconds
            </span>
            <Input
              type="number"
              min={minSeconds}
              max={15}
              value={scene.durationSeconds}
              disabled={disabled || rewriting}
              onChange={(event) =>
                onChange({ durationSeconds: Number(event.target.value) })
              }
              aria-invalid={durationError}
              className="h-9 w-14 px-2 font-mono lg:h-8"
            />
            <span className="t-sm text-ink-2">s</span>
          </label>
        )}
        {readOnly ? null : (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            disabled={disabled || rewriting}
            aria-busy={rewriting}
            onClick={onRewrite}
          >
            {rewriting ? <Spinner /> : null}
            {rewriteFailed ? 'Try again' : 'Rewrite scene'}
            <ButtonCost>{CREDIT_COST.rewrite} credit</ButtonCost>
          </Button>
        )}
        {durationError ? (
          <div className="w-full">
            <FieldError>
              {minSeconds <= 2
                ? 'Use 2 to 15 seconds.'
                : minSeconds >= 15
                  ? `Use 15 seconds, or shorten the ${spoken}.`
                  : `Use ${minSeconds} to 15 seconds. The ${spoken} ${skit ? 'take' : 'takes'} about ${minSeconds} s${spoken === 'lines and pauses' ? '' : ' to say'}.`}
            </FieldError>
          </div>
        ) : null}
      </div>

      {rewriting ? (
        <div className="flex flex-col gap-2 p-4" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <p className="t-sm text-ink-2" role="status">
            Rewriting this scene…
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          {skit ? (
            <SceneLines
              id={id}
              lines={scene.lines}
              sound={scene.sound ?? ''}
              durationSeconds={scene.durationSeconds}
              language={language}
              readOnly={readOnly}
              disabled={disabled}
              describedBy={flags.length > 0 ? flagId : undefined}
              onLines={(lines) => onChange({ lines })}
              onSound={(sound) => onChange({ sound })}
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <label htmlFor={`${id}-narration`} className="t-label">
                  Narration
                </label>
                <Badge dot={false}>{LANGUAGE_LABEL[language]}</Badge>
              </div>
              {readOnly ? (
                <p
                  className="t-body"
                  lang={language === ScriptLanguage.Filipino ? 'fil' : 'en'}
                >
                  {scene.narration}
                </p>
              ) : (
                <Textarea
                  id={`${id}-narration`}
                  rows={2}
                  maxLength={600}
                  value={scene.narration}
                  disabled={disabled}
                  lang={language === ScriptLanguage.Filipino ? 'fil' : 'en'}
                  onChange={(event) =>
                    onChange({ narration: event.target.value })
                  }
                  aria-describedby={flags.length > 0 ? flagId : undefined}
                  className="min-h-16"
                />
              )}
            </div>
          )}

          {opensWithHook ? (
            <p className="t-caption text-ink-3">
              {skit
                ? 'The first line is your hook. Picking or editing a hook changes it.'
                : 'This narration is your hook. Picking or editing a hook changes it.'}
            </p>
          ) : null}

          {closingNote ? (
            <p className="t-caption text-ink-3">{closingNote}</p>
          ) : null}

          {flags.length > 0 ? (
            <div id={flagId} className="flex flex-col gap-2">
              {flags.map((flag) => (
                <ClaimFlagCallout
                  key={`${flag.category}-${flag.claim}`}
                  lead={flag.lead}
                  reason={flag.reason}
                  action={
                    flag.category === ClaimFlagCategory.NotApprovedFact &&
                    !readOnly ? (
                      <Button
                        variant="link"
                        className="text-small"
                        onClick={() => onAddFact(flag.claim)}
                      >
                        Add as a fact
                      </Button>
                    ) : null
                  }
                />
              ))}
            </div>
          ) : null}

          {rewriteFailed ? (
            <p className="t-sm text-danger" role="alert">
              Rewrite didn’t finish. Your scene is unchanged. You weren’t
              charged.
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-text`} className="t-label">
                On-screen text
              </label>
              {readOnly ? (
                <p className="t-body">{scene.onScreenText}</p>
              ) : (
                <>
                  <Input
                    id={`${id}-text`}
                    maxLength={60}
                    value={scene.onScreenText}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange({ onScreenText: event.target.value })
                    }
                  />
                  <span className="t-mono self-end text-caption text-ink-3">
                    {scene.onScreenText.length} / 60
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-visual`} className="t-label">
                Suggested visual
              </label>
              {readOnly ? (
                <p className="t-body">{scene.visual}</p>
              ) : (
                <Textarea
                  id={`${id}-visual`}
                  rows={2}
                  maxLength={200}
                  value={scene.visual}
                  disabled={disabled}
                  onChange={(event) => onChange({ visual: event.target.value })}
                  className="min-h-16"
                />
              )}
            </div>
          </div>

          {readOnly ? (
            scene.direction || transitionSuffix ? (
              <div className="flex flex-col gap-1.5">
                <span className="t-label">Shot direction</span>
                <p className="t-body">
                  {[
                    ...(scene.direction
                      ? [
                          SHOT_FRAMING_LABEL[scene.direction.framing],
                          inFrameLabel(scene.direction.inFrame),
                          scene.direction.setting,
                        ]
                      : []),
                    transitionSuffix,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {scene.direction?.props ? (
                  <p className="t-sm text-ink-2">
                    Props: {scene.direction.props}
                  </p>
                ) : null}
              </div>
            ) : null
          ) : (
            <fieldset className="grid gap-4 md:grid-cols-2" disabled={disabled}>
              <legend className="t-label mb-1.5">Shot direction</legend>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-in-frame`} className="t-sm text-ink-2">
                  In frame
                </label>
                <Select
                  value={direction.inFrame}
                  disabled={disabled}
                  onValueChange={(value) =>
                    setDirection({ inFrame: value as ShotSubject })
                  }
                >
                  <SelectTrigger id={`${id}-in-frame`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {Object.values(ShotSubject).map((value) => (
                        <SelectItem key={value} value={value}>
                          {inFrameLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-framing`} className="t-sm text-ink-2">
                  Framing
                </label>
                <Select
                  value={direction.framing}
                  disabled={disabled}
                  onValueChange={(value) =>
                    setDirection({ framing: value as ShotFraming })
                  }
                >
                  <SelectTrigger id={`${id}-framing`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {Object.values(ShotFraming).map((value) => (
                        <SelectItem key={value} value={value}>
                          {SHOT_FRAMING_LABEL[value]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-setting`} className="t-sm text-ink-2">
                  Setting
                </label>
                <Input
                  id={`${id}-setting`}
                  maxLength={80}
                  placeholder="Where, and the light"
                  value={direction.setting}
                  onChange={(event) =>
                    setDirection({ setting: event.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-props`} className="t-sm text-ink-2">
                  Props
                </label>
                <Input
                  id={`${id}-props`}
                  maxLength={120}
                  placeholder="Separate with commas"
                  value={direction.props}
                  onChange={(event) =>
                    setDirection({ props: event.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                {index === 0 ? (
                  <span className="t-sm text-ink-2">Transition in</span>
                ) : (
                  <label
                    htmlFor={`${id}-transition`}
                    className="t-sm text-ink-2"
                  >
                    Transition in
                  </label>
                )}
                {index === 0 ? (
                  <p className="t-caption text-ink-3">Opens the video.</p>
                ) : (
                  <>
                    <Select
                      value={transitionIn}
                      disabled={disabled}
                      onValueChange={(value) =>
                        onTransition(value as SceneTransition)
                      }
                    >
                      <SelectTrigger id={`${id}-transition`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {Object.values(SceneTransition).map((value) => (
                            <SelectItem key={value} value={value}>
                              {SCENE_TRANSITION_LABEL[value]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <p className="t-caption text-ink-3">
                      {SCENE_TRANSITION_HINT[transitionIn]}
                    </p>
                  </>
                )}
              </div>
            </fieldset>
          )}

          {scene.purpose === ScenePurpose.CallToAction ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-cta`} className="t-label">
                CTA
              </label>
              {readOnly ? (
                <p className="t-body">{scene.cta}</p>
              ) : (
                <Input
                  id={`${id}-cta`}
                  maxLength={80}
                  value={scene.cta ?? ''}
                  disabled={disabled}
                  onChange={(event) => onChange({ cta: event.target.value })}
                />
              )}
            </div>
          ) : null}

          {claims ? (
            <p className="flex flex-wrap items-center gap-1.5">
              <span className="t-caption text-ink-3">
                {scene.factIds.length > 0 ? 'Uses' : 'Uses no facts'}
              </span>
              {scene.factIds.map((factId) =>
                facts.has(factId) ? (
                  <Badge key={factId} dot={false}>
                    {facts.get(factId)}
                  </Badge>
                ) : null,
              )}
            </p>
          ) : null}
        </div>
      )}
    </li>
  );
}
