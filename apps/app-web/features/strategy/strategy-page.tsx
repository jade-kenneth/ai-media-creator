'use client';

import { useQueryClient } from '@tanstack/react-query';
import { CheckIcon, CircleAlertIcon, TriangleAlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import {
  StepPage,
  SaveFailedBanner,
} from '@/features/project-workflow/step-page';
import { useAutosave } from '@/features/project-workflow/use-autosave';
import {
  useIdempotencyKey,
  useProjectJobs,
} from '@/features/project-workflow/use-project-jobs';
import { useWorkflow } from '@/features/project-workflow/workflow-state';
import { useOnlineStatus } from '@/hooks/use-online-status';
import {
  CONTENT_STYLE_LABEL,
  SKIT_STYLE_HINT,
  CREDIT_COST,
  failureCause,
  LANGUAGE_LABEL,
  PLATFORM_LABEL,
  TONE_LABEL,
} from '@/lib/studio/labels';
import { useMyCreditsQuery } from '@/react-query/credits/credits-operations';
import {
  isJobActive,
  useRetryGenerationJobMutation,
} from '@/react-query/generation-jobs/generation-jobs-operations';
import {
  AngleKind,
  ContentStyle,
  GenerationJobStatus,
  GenerationJobType,
  Platform,
  ProjectStepKey,
  ScriptLanguage,
  Tone,
  type UpdateStrategyInput,
} from '@/react-query/generated__types';
import {
  projectsQueryKeys,
  useSuggestAnglesMutation,
  useSuggestAudiencesMutation,
  useUpdateStrategyMutation,
  type ProjectDetail,
} from '@/react-query/projects/projects-operations';
import { useWriteScriptMutation } from '@/react-query/scripts/scripts-operations';

import { AnglePicker, OWN_ANGLE } from './angle-picker';
import { AudiencePicker } from './audience-picker';

type StrategyPatch = Omit<UpdateStrategyInput, 'projectId'>;

const LENGTHS = ['20', '30', '40'] as const;

function enumOptions<Value extends string>(labels: Record<Value, string>) {
  return (Object.keys(labels) as Value[]).map((value) => ({
    value,
    label: labels[value],
  }));
}

/** Strategy (Design Reference §5.7). */
export function StrategyPage() {
  const { project, navigate } = useWorkflow();
  const router = useRouter();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const credits = useMyCreditsQuery();
  const balance = credits.data?.myCredits.balance ?? null;
  const [strategy, setStrategy] = useState(project.strategy);
  const [buyerTouched, setBuyerTouched] = useState(false);
  const [writeAttempted, setWriteAttempted] = useState(false);
  const suggestKey = useIdempotencyKey();
  const audienceKey = useIdempotencyKey();
  const writeKey = useIdempotencyKey();

  useOfflineDetail('Changes will save when you reconnect.');

  // New suggestions can replace a chosen one; the server then clears it.
  const suggestionsAt = project.angleSuggestionSet?.createdAt;
  const [seenSuggestionsAt, setSeenSuggestionsAt] = useState(suggestionsAt);
  if (suggestionsAt !== seenSuggestionsAt) {
    setSeenSuggestionsAt(suggestionsAt);
    setStrategy((current) => ({
      ...current,
      selectedAngle: project.strategy.selectedAngle,
    }));
  }

  const setProject = useCallback(
    (next: ProjectDetail) =>
      queryClient.setQueryData(projectsQueryKeys.detail(next.id), {
        project: next,
      }),
    [queryClient],
  );

  const updateStrategy = useUpdateStrategyMutation();
  const autosave = useAutosave<StrategyPatch>({
    source: 'strategy',
    save: async (patch) => {
      const data = await updateStrategy.mutateAsync({
        input: { projectId: project.id, ...patch },
      });
      setProject(data.updateStrategy);
    },
  });

  const change = (patch: StrategyPatch, local: Partial<typeof strategy>) => {
    setStrategy((current) => ({ ...current, ...local }));
    autosave.schedule(patch);
  };

  const { latest, track } = useProjectJobs(project.id, (job) => {
    if (
      job.type !== GenerationJobType.SuggestAngles &&
      job.type !== GenerationJobType.SuggestAudiences
    ) {
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: projectsQueryKeys.detail(project.id),
    });
    if (job.status === GenerationJobStatus.Completed) {
      toast.success(
        `${job.type === GenerationJobType.SuggestAudiences ? 'Audiences' : 'Angles'} ready. Used ${job.creditCost} credit.`,
      );
    }
  });

  const audienceJob = latest(GenerationJobType.SuggestAudiences);
  const suggestingAudiences = Boolean(audienceJob && isJobActive(audienceJob));
  const audienceSet = project.audienceSuggestionSet;
  const audienceFailed =
    audienceJob?.status === GenerationJobStatus.Failed &&
    (!audienceSet ||
      new Date(audienceSet.createdAt) < new Date(audienceJob.createdAt));
  const suggestAudiences = useSuggestAudiencesMutation({
    onSuccess: ({ suggestAudiences: job }) => track(job),
    onError: (error) => toast.error(error.message),
    onSettled: () => audienceKey.rotate(),
  });
  const audienceBusy = suggestAudiences.isPending || suggestingAudiences;
  const startAudiences = () => {
    if (audienceBusy) return;
    autosave.flush();
    suggestAudiences.mutate({
      input: { projectId: project.id, idempotencyKey: audienceKey.current() },
    });
  };
  // A card is chosen while the three fields still read exactly as it does.
  const chosenAudience =
    audienceSet?.suggestions.find(
      (item) =>
        item.buyer === (strategy.buyer ?? '') &&
        item.problem === (strategy.problem ?? '') &&
        item.benefit === (strategy.benefit ?? ''),
    )?.id ?? null;

  const suggestJob = latest(GenerationJobType.SuggestAngles);
  const suggesting = Boolean(suggestJob && isJobActive(suggestJob));
  const suggestFailed =
    suggestJob?.status === GenerationJobStatus.Failed &&
    (!project.angleSuggestionSet ||
      new Date(project.angleSuggestionSet.createdAt) <
        new Date(suggestJob.createdAt));

  const suggest = useSuggestAnglesMutation({
    onSuccess: ({ suggestAngles }) => track(suggestAngles),
    onError: (error) => toast.error(error.message),
    onSettled: () => suggestKey.rotate(),
  });
  const retry = useRetryGenerationJobMutation({
    onSuccess: ({ retryGenerationJob }) => track(retryGenerationJob),
    onError: (error) => toast.error(error.message),
  });
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

  const selected = strategy.selectedAngle;
  const pickerValue =
    selected?.kind === AngleKind.Own
      ? OWN_ANGLE
      : (selected?.suggestionId ?? null);
  const hasAngle = Boolean(selected?.text.trim());
  const hasBuyer = Boolean(strategy.buyer?.trim());
  const short = balance !== null && balance < CREDIT_COST.writeScript;
  const writeReason = !hasBuyer
    ? 'Add who the buyer is'
    : !hasAngle
      ? 'Choose or write an angle'
      : short
        ? `You need ${CREDIT_COST.writeScript} credits. You have ${balance}.`
        : null;
  const writing = write.isPending || write.isSuccess;

  const startSuggest = () => {
    if (suggest.isPending || suggesting) return;
    autosave.flush();
    suggest.mutate({
      input: { projectId: project.id, idempotencyKey: suggestKey.current() },
    });
  };

  const startWrite = () => {
    setWriteAttempted(true);
    if (writing || writeReason) return;
    autosave.flush();
    write.mutate({
      input: { projectId: project.id, idempotencyKey: writeKey.current() },
    });
  };

  const textField = (
    name: 'buyer' | 'problem' | 'benefit',
    label: string,
    placeholder: string,
    max: number,
  ) => {
    const showError =
      name === 'buyer' && !hasBuyer && (buyerTouched || writeAttempted);

    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel
          htmlFor={`strategy-${name}`}
          requirement={name === 'buyer' ? 'required' : 'optional'}
        >
          {label}
        </FieldLabel>
        <Input
          id={`strategy-${name}`}
          value={strategy[name] ?? ''}
          maxLength={max}
          placeholder={placeholder}
          disabled={!online}
          onChange={(event) =>
            change(
              { [name]: event.target.value },
              { [name]: event.target.value },
            )
          }
          onBlur={() => {
            if (name === 'buyer') setBuyerTouched(true);
            autosave.flush();
          }}
          aria-invalid={showError}
          aria-describedby={showError ? `strategy-${name}-error` : undefined}
        />
        {showError ? (
          <FieldError id={`strategy-${name}-error`}>
            Add who the buyer is.
          </FieldError>
        ) : null}
      </div>
    );
  };

  return (
    <StepPage
      step={ProjectStepKey.Strategy}
      title="Strategy"
      subtitle="Who is this for, and what’s the angle? We use this with your approved facts to write hooks and a script."
      autosave
      asideWidth="280"
      banners={<SaveFailedBanner />}
      aside={
        <Card>
          <CardHeader>
            <CardTitle>Approved facts</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <ul className="t-sm flex flex-col gap-2">
              {project.approvedFacts.map((fact) => (
                <li key={fact.id} className="flex gap-2">
                  <CheckIcon
                    aria-hidden="true"
                    className="mt-0.5 size-3.5 shrink-0 text-success"
                  />
                  {fact.text}
                </li>
              ))}
            </ul>
            <Button
              variant="link"
              className="self-start"
              onClick={() => navigate(`/projects/${project.id}/facts`)}
            >
              Edit facts
            </Button>
          </CardContent>
        </Card>
      }
      footer={{
        back: { label: 'Facts', href: `/projects/${project.id}/facts` },
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
          <CardTitle>Audience</CardTitle>
          <CardAction>
            <Button
              variant="secondary"
              onClick={startAudiences}
              disabled={
                !online ||
                audienceBusy ||
                (balance !== null && balance < CREDIT_COST.suggestAudiences)
              }
              aria-busy={audienceBusy}
            >
              {audienceBusy ? <Spinner /> : null}
              {audienceBusy
                ? 'Suggesting…'
                : audienceSet
                  ? 'Suggest again'
                  : 'Suggest audiences'}
              <ButtonCost>{CREDIT_COST.suggestAudiences} credit</ButtonCost>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {audienceSet?.isStale && !suggestingAudiences ? (
            <Alert variant="warning">
              <TriangleAlertIcon />
              <AlertContent>
                <AlertTitle>
                  Your approved facts changed after these audiences were
                  suggested.
                </AlertTitle>{' '}
                <AlertDescription>
                  Suggest again to use the latest facts.
                </AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}
          {audienceFailed && audienceJob && !suggestingAudiences ? (
            <Alert variant="danger" role="alert">
              <CircleAlertIcon />
              <AlertContent>
                <AlertTitle>Audience suggestions didn’t finish.</AlertTitle>{' '}
                <AlertDescription>
                  {failureCause(audienceJob.type, audienceJob.failureCode)} You
                  weren’t charged.
                </AlertDescription>
              </AlertContent>
              <AlertAction>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!online || retry.isPending}
                  onClick={() => {
                    if (!retry.isPending) retry.mutate({ id: audienceJob.id });
                  }}
                >
                  {retry.isPending ? <Spinner /> : null}
                  Try again
                  <ButtonCost>{CREDIT_COST.suggestAudiences} credit</ButtonCost>
                </Button>
              </AlertAction>
            </Alert>
          ) : null}
          {!audienceSet && !suggestingAudiences ? (
            <p className="t-sm text-ink-2" aria-live="polite">
              Get three audiences grounded in your approved facts, or type your
              own.
            </p>
          ) : null}
          {suggestingAudiences ? (
            <p className="sr-only" role="status">
              Suggesting audiences…
            </p>
          ) : null}
          <AudiencePicker
            suggestions={audienceSet?.suggestions ?? []}
            suggesting={suggestingAudiences}
            value={chosenAudience}
            facts={project.approvedFacts}
            disabled={!online}
            onSelect={(suggestion) => {
              const fields = {
                buyer: suggestion.buyer,
                problem: suggestion.problem,
                benefit: suggestion.benefit,
              };
              change(fields, fields);
              autosave.flush();
            }}
          />
          {textField(
            'buyer',
            'Who is the buyer?',
            'e.g. Office workers who skip breakfast',
            120,
          )}
          {textField(
            'problem',
            'What problem do they have?',
            'e.g. No time to eat before the commute',
            160,
          )}
          {textField(
            'benefit',
            'What do they want instead?',
            'e.g. A filling breakfast they can take along',
            160,
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="t-label" id="strategy-platform">
              Platform
            </p>
            <ChoiceGroup<Platform>
              label="Platform"
              value={strategy.platform}
              disabled={!online}
              aria-describedby="strategy-platform-hint"
              onValueChange={(platform) => change({ platform }, { platform })}
              options={enumOptions(PLATFORM_LABEL)}
            />
            <FieldHint id="strategy-platform-hint">
              Add the affiliate disclosure your platform requires. We’ll remind
              you in the creator brief.
            </FieldHint>
          </div>
          <div className="flex flex-col gap-2">
            <p className="t-label">Script language</p>
            <ChoiceGroup<ScriptLanguage>
              label="Script language"
              value={strategy.language}
              disabled={!online}
              onValueChange={(language) => change({ language }, { language })}
              options={enumOptions(LANGUAGE_LABEL)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="t-label">Length</p>
            <ChoiceGroup<(typeof LENGTHS)[number]>
              label="Length"
              variant="segment"
              value={String(strategy.lengthSeconds) as (typeof LENGTHS)[number]}
              disabled={!online}
              onValueChange={(length) =>
                change(
                  { lengthSeconds: Number(length) },
                  { lengthSeconds: Number(length) },
                )
              }
              options={LENGTHS.map((length) => ({
                value: length,
                label: `${length} s`,
              }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="t-label">Tone</p>
            <ChoiceGroup<Tone>
              label="Tone"
              value={strategy.tone}
              disabled={!online}
              onValueChange={(tone) => change({ tone }, { tone })}
              options={enumOptions(TONE_LABEL)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="t-label">Content style</p>
            <ChoiceGroup<ContentStyle>
              label="Content style"
              value={strategy.contentStyle}
              disabled={!online}
              aria-describedby={
                strategy.contentStyle === ContentStyle.Skit
                  ? 'strategy-style-hint'
                  : undefined
              }
              onValueChange={(contentStyle) =>
                change({ contentStyle }, { contentStyle })
              }
              options={enumOptions(CONTENT_STYLE_LABEL)}
            />
            {strategy.contentStyle === ContentStyle.Skit ? (
              <FieldHint id="strategy-style-hint">{SKIT_STYLE_HINT}</FieldHint>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selling angle</CardTitle>
          <CardAction>
            <Button
              variant="secondary"
              onClick={startSuggest}
              disabled={
                !online ||
                suggest.isPending ||
                suggesting ||
                (balance !== null && balance < CREDIT_COST.suggestAngles)
              }
              aria-busy={suggest.isPending || suggesting}
            >
              {suggest.isPending || suggesting ? <Spinner /> : null}
              {suggest.isPending || suggesting
                ? 'Suggesting…'
                : project.angleSuggestionSet
                  ? 'Suggest again'
                  : 'Suggest angles'}
              <ButtonCost>{CREDIT_COST.suggestAngles} credit</ButtonCost>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="gap-4">
          {project.angleSuggestionSet?.isStale && !suggesting ? (
            <Alert variant="warning">
              <TriangleAlertIcon />
              <AlertContent>
                <AlertTitle>
                  Your approved facts changed after these angles were suggested.
                </AlertTitle>{' '}
                <AlertDescription>
                  Suggest again to use the latest facts.
                </AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}
          {suggestFailed && suggestJob && !suggesting ? (
            <Alert variant="danger" role="alert">
              <CircleAlertIcon />
              <AlertContent>
                <AlertTitle>Angle suggestions didn’t finish.</AlertTitle>{' '}
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
                  <ButtonCost>{CREDIT_COST.suggestAngles} credit</ButtonCost>
                </Button>
              </AlertAction>
            </Alert>
          ) : null}
          {!project.angleSuggestionSet && !suggesting ? (
            <p className="t-sm text-ink-2" aria-live="polite">
              Get three angles grounded in your approved facts, or write your
              own.
            </p>
          ) : null}
          {suggesting ? (
            <p className="sr-only" role="status">
              Suggesting angles…
            </p>
          ) : null}
          <AnglePicker
            suggestions={project.angleSuggestionSet?.suggestions ?? []}
            suggesting={suggesting}
            value={pickerValue}
            ownText={selected?.kind === AngleKind.Own ? selected.text : ''}
            ownError={
              selected?.kind === AngleKind.Own && !hasAngle && writeAttempted
                ? 'Describe your angle, or pick a suggestion.'
                : null
            }
            facts={project.approvedFacts}
            disabled={!online}
            onSelect={(value) => {
              if (value === OWN_ANGLE) {
                const text =
                  selected?.kind === AngleKind.Own ? selected.text : '';
                change(
                  { selectedAngle: { kind: AngleKind.Own, text } },
                  {
                    selectedAngle: {
                      kind: AngleKind.Own,
                      suggestionId: null,
                      text,
                    },
                  },
                );
                return;
              }
              const suggestion = project.angleSuggestionSet?.suggestions.find(
                (candidate) => candidate.id === value,
              );
              if (!suggestion) return;
              change(
                {
                  selectedAngle: {
                    kind: AngleKind.Suggested,
                    suggestionId: suggestion.id,
                  },
                },
                {
                  selectedAngle: {
                    kind: AngleKind.Suggested,
                    suggestionId: suggestion.id,
                    text: suggestion.title,
                  },
                },
              );
            }}
            onOwnTextChange={(text) =>
              change(
                { selectedAngle: { kind: AngleKind.Own, text } },
                {
                  selectedAngle: {
                    kind: AngleKind.Own,
                    suggestionId: null,
                    text,
                  },
                },
              )
            }
            onOwnTextBlur={autosave.flush}
          />
        </CardContent>
      </Card>
    </StepPage>
  );
}
