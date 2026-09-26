'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { CircleAlertIcon, TriangleAlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  useFormState,
  useWatch,
  type FieldPath,
} from 'react-hook-form';
import { toast } from 'sonner';

import {
  FieldError,
  FieldHint,
  FieldLabel,
} from '@/components/studio/field-label';
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button, ButtonCost } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import {
  SaveFailedBanner,
  StepPage,
} from '@/features/project-workflow/step-page';
import { useAutosave } from '@/features/project-workflow/use-autosave';
import {
  useIdempotencyKey,
  useProjectJobs,
} from '@/features/project-workflow/use-project-jobs';
import { useWorkflow } from '@/features/project-workflow/workflow-state';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { CREDIT_COST, failureCause, LANGUAGE_LABEL } from '@/lib/studio/labels';
import {
  GENRE_LABEL,
  GENRE_NOTE,
  STORY_LENGTHS,
  STORY_LIMITS,
  STORY_RULES,
  STORYTELLING_HINT,
  STORYTELLING_LABEL,
} from '@/lib/studios';
import { useMyCreditsQuery } from '@/react-query/credits/credits-operations';
import {
  isJobActive,
  useRetryGenerationJobMutation,
} from '@/react-query/generation-jobs/generation-jobs-operations';
import {
  GenerationJobStatus,
  GenerationJobType,
  ProjectStepKey,
  ScriptLanguage,
  Storytelling,
} from '@/react-query/generated__types';
import {
  projectsQueryKeys,
  useSuggestPremisesMutation,
  useUpdateStoryMutation,
  type ProjectDetail,
} from '@/react-query/projects/projects-operations';
import { useWriteScriptMutation } from '@/react-query/scripts/scripts-operations';

import { CastCard } from './cast-card';
import { GenreChips } from './genre-chips';
import { PremisePicker, type PremiseOption } from './premise-picker';
import {
  castIssues,
  collapse,
  getStoryDefaults,
  isBlankCharacter,
  OWN_PREMISE,
  storyFormSchema,
  toCastInput,
  toPremiseInput,
  type StoryFormValues,
  type StoryPatch,
} from './story-form.schema';

const LENGTH_OPTIONS = STORY_LENGTHS.map((length) => ({
  value: `${length}` as const,
  label: `${length} s`,
}));

/** Choices that save at once; typing waits for the autosave debounce. */
const DISCRETE_FIELDS = new Set([
  'genre',
  'premiseChoice',
  'storytelling',
  'language',
  'lengthSeconds',
  'cast',
]);

const STORYTELLING_OPTIONS = [Storytelling.Acted, Storytelling.Narrated].map(
  (value) => ({ value, label: STORYTELLING_LABEL[value] }),
);

const LANGUAGE_OPTIONS = [
  ScriptLanguage.English,
  ScriptLanguage.Filipino,
  ScriptLanguage.Taglish,
].map((value) => ({ value, label: LANGUAGE_LABEL[value] }));

/** The patch one changed field writes, or null when nothing should save. */
function toStoryPatch(
  name: string,
  values: StoryFormValues,
): { patch: StoryPatch; cast?: string } | null {
  if (name === 'genre')
    return values.genre ? { patch: { genre: values.genre } } : null;
  if (name === 'detail')
    return collapse(values.detail).length <= STORY_LIMITS.detail
      ? { patch: { detail: values.detail } }
      : null;
  if (name === 'storytelling')
    return { patch: { storytelling: values.storytelling } };
  if (name === 'language') return { patch: { language: values.language } };
  if (name === 'lengthSeconds')
    return { patch: { lengthSeconds: values.lengthSeconds } };

  if (name === 'premiseChoice' || name === 'ownText') {
    if (name === 'ownText' && values.premiseChoice !== OWN_PREMISE) return null;
    const premise = toPremiseInput(values);

    return premise ? { patch: { premise } } : null;
  }

  if (name === 'cast' || name.startsWith('cast.')) {
    const cast = toCastInput(values.cast);

    return cast ? { patch: { cast }, cast: JSON.stringify(cast) } : null;
  }

  return null;
}

function StoryRulesCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Story rules</CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        <ul className="t-sm flex list-disc flex-col gap-2 pl-4">
          {STORY_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="t-caption text-ink-3">
          These are reminders, not a compliance check. The final review is
          yours.
        </p>
      </CardContent>
    </Card>
  );
}

/** Story (Product Specification §3.23, Design Reference §5.17). */
export function StoryPage() {
  const { project, navigate } = useWorkflow();
  const router = useRouter();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const credits = useMyCreditsQuery();
  const balance = credits.data?.myCredits.balance ?? null;
  const [writeAttempted, setWriteAttempted] = useState(false);
  const [suggestStarting, setSuggestStarting] = useState(false);
  const [defaults] = useState(() => getStoryDefaults(project.story));
  const lastCast = useRef(JSON.stringify(toCastInput(defaults.cast)));
  const suggestKey = useIdempotencyKey();
  const writeKey = useIdempotencyKey();

  useOfflineDetail('Changes will save when you reconnect.');

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    mode: 'onTouched',
    defaultValues: defaults,
  });
  const cast = useFieldArray({ control: form.control, name: 'cast' });

  const setProject = useCallback(
    (next: ProjectDetail) =>
      queryClient.setQueryData(projectsQueryKeys.detail(next.id), {
        project: next,
      }),
    [queryClient],
  );

  const updateStory = useUpdateStoryMutation();
  const { schedule, flush, flushAndWait } = useAutosave<StoryPatch>({
    source: 'story',
    save: async (patch) => {
      const data = await updateStory.mutateAsync({
        input: { projectId: project.id, ...patch },
      });
      setProject(data.updateStory);
    },
  });

  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ name, values }) => {
          if (!name) return;
          const change = toStoryPatch(name, values);
          if (!change) return;
          // Adding a blank row or re-typing the same name changes nothing saved.
          if (change.cast !== undefined) {
            if (change.cast === lastCast.current) return;
            lastCast.current = change.cast;
          }
          schedule(change.patch);
          if (DISCRETE_FIELDS.has(name)) flush();
        },
      }),
    [flush, form, schedule],
  );

  const [genre, detail, premiseChoice, ownText, castValues, storytelling] =
    useWatch({
      control: form.control,
      name: [
        'genre',
        'detail',
        'premiseChoice',
        'ownText',
        'cast',
        'storytelling',
      ],
    });
  const { errors, touchedFields } = useFormState({
    control: form.control,
    name: ['detail', 'ownText'],
  });

  // ── Premise suggestions ────────────────────────────────────────────────
  const { latest, track } = useProjectJobs(project.id, (job) => {
    if (job.type !== GenerationJobType.SuggestPremises) return;
    void queryClient.invalidateQueries({
      queryKey: projectsQueryKeys.detail(project.id),
    });
    if (job.status === GenerationJobStatus.Completed) {
      toast.success(`Premises ready. Used ${job.creditCost} credit.`);
    }
  });

  const set = project.premiseSuggestionSet;
  const suggestJob = latest(GenerationJobType.SuggestPremises);
  const suggesting = Boolean(suggestJob && isJobActive(suggestJob));
  const suggestFailed =
    suggestJob?.status === GenerationJobStatus.Failed &&
    (!set || new Date(set.createdAt) < new Date(suggestJob.createdAt));
  const genreStale = Boolean(set && genre && set.genre !== genre);
  const detailStale = Boolean(set && collapse(detail) !== set.detail);
  const stale = genreStale || detailStale;

  const suggest = useSuggestPremisesMutation({
    onSuccess: ({ suggestPremises }) => track(suggestPremises),
    onError: (error) => toast.error(error.message),
    onSettled: () => suggestKey.rotate(),
  });
  const retry = useRetryGenerationJobMutation({
    onSuccess: ({ retryGenerationJob }) => track(retryGenerationJob),
    onError: (error) => toast.error(error.message),
  });
  const suggestBusy = suggestStarting || suggest.isPending || suggesting;

  const startSuggest = async () => {
    if (suggestBusy || !genre) return;
    const valid = await form.trigger('detail', { shouldFocus: true });
    if (!valid) return;

    setSuggestStarting(true);
    try {
      const saved = await flushAndWait();
      if (!saved) return;
      await suggest.mutateAsync({
        input: { projectId: project.id, idempotencyKey: suggestKey.current() },
      });
    } catch {
      // The mutation's onError callback owns the user-facing message.
    } finally {
      setSuggestStarting(false);
    }
  };

  // A chosen suggestion from an earlier set stays chosen and on screen.
  const suggestions = set?.suggestions ?? [];
  const kept = project.story?.premise;
  const options: PremiseOption[] =
    kept?.suggestionId &&
    kept.suggestionId === premiseChoice &&
    !suggestions.some((option) => option.id === kept.suggestionId)
      ? [
          {
            id: kept.suggestionId,
            title: kept.title,
            logline: kept.logline,
            cast: [],
          },
          ...suggestions,
        ]
      : suggestions;

  const choosePremise = (value: string) => {
    if (value === OWN_PREMISE) {
      form.setValue('premiseChoice', OWN_PREMISE);
      return;
    }
    const suggestion = suggestions.find((option) => option.id === value);
    if (!suggestion) return;
    form.setValue('premiseChoice', suggestion.id);
    // Only an empty cast takes the suggestion's; typed characters stay.
    if (form.getValues('cast').every(isBlankCharacter)) {
      cast.replace(
        suggestion.cast.map(({ id, name, role, look }) => ({
          id,
          name,
          role,
          look,
        })),
      );
    }
  };

  const hasPremise =
    premiseChoice === OWN_PREMISE
      ? Boolean(collapse(ownText))
      : Boolean(premiseChoice);
  const ownError =
    premiseChoice === OWN_PREMISE &&
    !collapse(ownText) &&
    (touchedFields.ownText || writeAttempted)
      ? 'Describe your story, or pick a suggestion.'
      : null;

  // ── Write hooks & script ───────────────────────────────────────────────
  const write = useWriteScriptMutation({
    onSuccess: ({ writeScript }) => {
      track(writeScript);
      void queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.detail(project.id),
      });
      router.push(`/projects/${project.id}/script`);
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => writeKey.rotate(),
  });
  const writing = write.isPending || write.isSuccess;

  const named = castValues.filter((character) => collapse(character.name));
  const short = balance !== null && balance < CREDIT_COST.writeScript;
  const writeReason = !genre
    ? 'Pick a genre'
    : !hasPremise
      ? 'Choose or write a premise'
      : storytelling === Storytelling.Acted && named.length === 0
        ? 'Add a character, or switch to Narrated'
        : short
          ? `You need ${CREDIT_COST.writeScript} credits. You have ${balance}.`
          : null;

  const startWrite = () => {
    setWriteAttempted(true);
    if (writing || writeReason) return;
    // A typed row that breaks a rule would be left out of the script.
    const typed = castValues.flatMap((character, index) =>
      isBlankCharacter(character) ? [] : [index],
    );
    const issues = castIssues(castValues).filter((issue) =>
      typed.includes(issue.index),
    );
    if (issues.length > 0) {
      const names = issues.map(
        (issue): FieldPath<StoryFormValues> =>
          `cast.${issue.index}.${issue.field}`,
      );
      void form.trigger(names, { shouldFocus: true });
      return;
    }
    flush();
    write.mutate({
      input: { projectId: project.id, idempotencyKey: writeKey.current() },
    });
  };

  const suggestButton = (
    <Button
      variant="secondary"
      onClick={startSuggest}
      disabled={
        !online ||
        suggestBusy ||
        !genre ||
        (balance !== null && balance < CREDIT_COST.suggestPremises)
      }
      aria-busy={suggestBusy}
    >
      {suggestBusy ? <Spinner /> : null}
      {suggestBusy ? 'Suggesting…' : set ? 'Suggest again' : 'Suggest premises'}
      <ButtonCost>{CREDIT_COST.suggestPremises} credit</ButtonCost>
    </Button>
  );

  return (
    <StepPage
      step={ProjectStepKey.Story}
      title="Story"
      subtitle="Pick a genre and give AI one detail. It will build the premise, cast and every scene."
      autosave
      asideWidth="280"
      banners={<SaveFailedBanner />}
      aside={<StoryRulesCard />}
      footer={{
        back: { label: 'Projects', href: '/projects' },
        reason: writeReason,
        meta: (
          <>
            {project.hasScript ? (
              <Button
                variant="ghost"
                className="max-sm:hidden"
                onClick={() => navigate(`/projects/${project.id}/script`)}
              >
                Open script
              </Button>
            ) : null}
            {balance !== null ? (
              <p className="t-sm text-ink-2 max-md:hidden">
                You have <span className="t-mono text-ink">{balance}</span>{' '}
                credits
              </p>
            ) : null}
          </>
        ),
        actions: (
          <Button
            onClick={startWrite}
            disabled={!online || writing || Boolean(writeReason)}
            aria-busy={writing}
          >
            {writing ? <Spinner /> : null}
            {writing
              ? 'Starting…'
              : project.hasScript
                ? 'Write a new version'
                : 'Write hooks & script'}
            {writing ? null : (
              <ButtonCost>{CREDIT_COST.writeScript} credits</ButtonCost>
            )}
          </Button>
        ),
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Genre</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          <Controller
            control={form.control}
            name="genre"
            render={({ field }) => (
              <GenreChips
                value={field.value}
                onValueChange={field.onChange}
                disabled={!online}
                describedBy={field.value ? 'story-genre-hint' : undefined}
              />
            )}
          />
          {genre ? (
            <FieldHint id="story-genre-hint">{GENRE_NOTE[genre]}</FieldHint>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Premise</CardTitle>
          <CardAction>
            {genre ? (
              suggestButton
            ) : (
              // A disabled button gets no pointer events, so the tooltip hangs on a wrapper.
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex rounded-md">
                    {suggestButton}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Pick a genre first</TooltipContent>
              </Tooltip>
            )}
          </CardAction>
        </CardHeader>
        <CardContent className="gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="story-detail">
              Story detail (optional)
            </FieldLabel>
            <Textarea
              id="story-detail"
              rows={2}
              maxLength={STORY_LIMITS.detail}
              placeholder="e.g. Two strangers reach for the same umbrella."
              disabled={!online}
              aria-invalid={Boolean(errors.detail)}
              aria-describedby={
                errors.detail
                  ? 'story-detail-hint story-detail-error'
                  : 'story-detail-hint'
              }
              {...form.register('detail', { onBlur: flush })}
            />
            <FieldHint id="story-detail-hint">
              A person, place, object or moment is enough. AI will build the
              premise and cast.
            </FieldHint>
            {errors.detail?.message ? (
              <FieldError id="story-detail-error">
                {errors.detail.message}
              </FieldError>
            ) : null}
          </div>
          {stale && genre && !suggesting ? (
            <Alert variant="warning">
              <TriangleAlertIcon />
              <AlertContent>
                {genreStale ? (
                  <>
                    <AlertTitle>
                      You changed the genre after these premises were suggested.
                    </AlertTitle>{' '}
                    <AlertDescription>
                      Suggest again for {GENRE_LABEL[genre]} ideas.
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertTitle>
                      You changed the story detail after these premises were
                      suggested.
                    </AlertTitle>{' '}
                    <AlertDescription>
                      Suggest again to use the new detail.
                    </AlertDescription>
                  </>
                )}
              </AlertContent>
            </Alert>
          ) : null}
          {suggestFailed && suggestJob && !suggesting ? (
            <Alert variant="danger" role="alert">
              <CircleAlertIcon />
              <AlertContent>
                <AlertTitle>Premise suggestions didn’t finish.</AlertTitle>{' '}
                <AlertDescription>
                  {failureCause(suggestJob.type, suggestJob.failureCode)} You
                  weren’t charged.
                </AlertDescription>
              </AlertContent>
              <AlertAction>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!online || retry.isPending}
                  onClick={() => {
                    if (!retry.isPending) retry.mutate({ id: suggestJob.id });
                  }}
                >
                  {retry.isPending ? <Spinner /> : null}
                  Try again
                  <ButtonCost>{CREDIT_COST.suggestPremises} credit</ButtonCost>
                </Button>
              </AlertAction>
            </Alert>
          ) : null}
          {!set && !suggesting ? (
            <p className="t-sm text-ink-2" aria-live="polite">
              Add one detail, then get three complete story ideas—or write the
              premise yourself.
            </p>
          ) : null}
          {suggesting ? (
            <p className="sr-only" role="status">
              Suggesting premises…
            </p>
          ) : null}
          <PremisePicker
            options={options}
            suggesting={suggesting}
            value={premiseChoice}
            ownField={form.register('ownText', { onBlur: flush })}
            ownError={ownError}
            disabled={!online}
            onSelect={choosePremise}
          />
        </CardContent>
      </Card>

      <CastCard
        form={form}
        cast={cast}
        disabled={!online}
        onBlurField={flush}
      />

      <Card>
        <CardHeader>
          <CardTitle>Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="t-label">Storytelling</p>
            <Controller
              control={form.control}
              name="storytelling"
              render={({ field }) => (
                <ChoiceGroup<Storytelling>
                  label="Storytelling"
                  value={field.value}
                  disabled={!online}
                  aria-describedby="story-storytelling-hint"
                  onValueChange={field.onChange}
                  options={STORYTELLING_OPTIONS}
                />
              )}
            />
            <FieldHint id="story-storytelling-hint">
              {STORYTELLING_HINT[storytelling]}
            </FieldHint>
          </div>
          <div className="flex flex-col gap-2">
            <p className="t-label">Script language</p>
            <Controller
              control={form.control}
              name="language"
              render={({ field }) => (
                <ChoiceGroup
                  label="Script language"
                  value={field.value}
                  disabled={!online}
                  onValueChange={field.onChange}
                  options={LANGUAGE_OPTIONS}
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="t-label">Length</p>
            <Controller
              control={form.control}
              name="lengthSeconds"
              render={({ field }) => (
                <ChoiceGroup
                  label="Length"
                  variant="segment"
                  value={
                    LENGTH_OPTIONS.find(
                      (option) => option.value === `${field.value}`,
                    )?.value ?? '45'
                  }
                  disabled={!online}
                  onValueChange={(length) => field.onChange(Number(length))}
                  options={LENGTH_OPTIONS}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <StoryRulesCard className="aside:hidden" />
    </StepPage>
  );
}
