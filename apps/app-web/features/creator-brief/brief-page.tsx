'use client';

import { CheckIcon, CopyIcon, DownloadIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import { StepPage } from '@/features/project-workflow/step-page';
import { useWorkflow } from '@/features/project-workflow/workflow-state';
import { studioOf } from '@/lib/studios';
import { ProjectStepKey } from '@/react-query/generated__types';
import { useCreatorBriefQuery } from '@/react-query/scripts/scripts-operations';

/**
 * Creator brief (Design Reference §5.9): no AI call, no credits. The API
 * builds the brief text for the project's studio; the aside card's title and
 * reminders come from the studio (§3.23).
 */
export function BriefPage() {
  const { project, navigate } = useWorkflow();
  const { briefAside } = studioOf(project.studio);
  const router = useRouter();
  const brief = useCreatorBriefQuery({ projectId: project.id });
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useOfflineDetail('Your brief stays readable; copy and download still work.');

  useEffect(() => {
    if (brief.isError && brief.error.name === 'ConflictError') {
      router.replace(`/projects/${project.id}/script?locked=brief`);
    }
  }, [brief.error, brief.isError, project.id, router]);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const data = brief.data?.creatorBrief;

  const copy = async () => {
    if (!data) return;

    try {
      await navigator.clipboard.writeText(data.text);
      setCopyFailed(false);
      setCopied(true);
      toast.success('Brief copied.');
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  const download = () => {
    if (!data) return;

    const url = URL.createObjectURL(new Blob([data.text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = data.fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const newer = data?.newerDraft;

  return (
    <StepPage
      step={ProjectStepKey.Brief}
      title="Creator brief"
      subtitle="A plain-text brief for filming or handing off. It comes from your approved script."
      asideWidth="320"
      banners={
        newer ? (
          <Alert variant={newer.hasNewClaim ? 'warning' : 'info'}>
            {newer.hasNewClaim ? <TriangleAlertIcon /> : <InfoIcon />}
            <AlertContent>
              <AlertTitle>
                {newer.hasNewClaim
                  ? `v${newer.number} is a newer draft with a new claim.`
                  : `v${newer.number} is a newer draft.`}
              </AlertTitle>{' '}
              <AlertDescription>
                {newer.hasNewClaim
                  ? `This brief still uses approved v${data?.versionNumber}.`
                  : `This brief uses approved v${data?.versionNumber} until you approve v${newer.number}.`}
              </AlertDescription>
            </AlertContent>
            <AlertAction>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/projects/${project.id}/script`)}
              >
                Review v{newer.number}
              </Button>
            </AlertAction>
          </Alert>
        ) : null
      }
      aside={
        <Card>
          <CardHeader>
            <CardTitle>{briefAside.title}</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <ul className="t-sm flex list-disc flex-col gap-1.5 pl-4">
              {briefAside.reminders.map((reminder) => (
                <li key={reminder}>{reminder}</li>
              ))}
            </ul>
            <p className="t-caption text-ink-3">
              These are reminders, not a compliance check. The final review is yours.
            </p>
          </CardContent>
        </Card>
      }
      footer={{
        back: { label: 'Script', href: `/projects/${project.id}/script` },
        actions: <Button onClick={() => navigate('/projects')}>Back to projects</Button>,
      }}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Brief for filming</CardTitle>
            {data ? <Badge variant="success">From v{data.versionNumber} · Approved</Badge> : null}
          </div>
          <CardAction>
            <Button variant="secondary" size="sm" onClick={() => void copy()} disabled={!data}>
              {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
              {copied ? 'Copied' : 'Copy brief'}
            </Button>
            <Button variant="secondary" size="sm" onClick={download} disabled={!data}>
              <DownloadIcon data-icon="inline-start" />
              Download .txt
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0 max-sm:p-0">
          {copyFailed ? (
            <p className="t-sm px-5 pt-4 text-danger" role="alert">
              Couldn’t copy. Select the text and copy it instead.
            </p>
          ) : null}
          {brief.isPending ? (
            <div className="flex flex-col gap-2 p-5" aria-busy="true" aria-label="Loading brief">
              {Array.from({ length: 18 }, (_, index) => (
                <Skeleton key={index} className="h-3" style={{ width: `${55 + ((index * 17) % 40)}%` }} />
              ))}
            </div>
          ) : data ? (
            <pre className="bg-canvas p-5 font-mono text-small whitespace-pre-wrap text-ink max-sm:text-caption">
              {data.text}
            </pre>
          ) : null}
        </CardContent>
      </Card>
    </StepPage>
  );
}
