'use client';

import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useId, useState } from 'react';

import { FieldError, FieldHint, FieldLabel } from '@/components/studio/field-label';
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  FieldSource,
  ImportOutcome,
  ProductField,
  type ImportProductMutation,
} from '@/react-query/generated__types';
import type { ProjectDetail } from '@/react-query/projects/projects-operations';

import { importUrlSchema } from './product-form.schema';

const FIELD_NAMES: Record<ProductField, string> = {
  [ProductField.Title]: 'title',
  [ProductField.Category]: 'category',
  [ProductField.Price]: 'price',
  [ProductField.Description]: 'description',
  [ProductField.Features]: 'features',
  [ProductField.AffiliateUrl]: 'affiliate link',
};

type ImportResult = Pick<
  ImportProductMutation['importProduct'],
  'outcome' | 'host' | 'filled' | 'missing'
>;

export function ImportCard({
  project,
  sessionResult,
  importing,
  clearing,
  online,
  onImport,
  onClear,
}: {
  project: ProjectDetail;
  sessionResult: ImportResult | null;
  importing: boolean;
  clearing: boolean;
  online: boolean;
  onImport: (url: string) => void;
  onClear: () => void;
}) {
  const [url, setUrl] = useState(project.product.importUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const hasImportedValues = project.product.fieldSources.some(
    (source) => source.source === FieldSource.Imported,
  );
  // Failures show for this visit only; a successful import stays visible
  // while imported values remain, so they can still be cleared.
  const result: ImportResult | null =
    sessionResult ??
    (hasImportedValues &&
    project.product.lastImport &&
    (project.product.lastImport.outcome === ImportOutcome.Partial ||
      project.product.lastImport.outcome === ImportOutcome.Filled)
      ? project.product.lastImport
      : null);

  const submit = () => {
    if (importing) return;

    const parsed = importUrlSchema.safeParse(url);

    if (!parsed.success) {
      setError('Enter a full link that starts with https://');
      return;
    }

    setError(null);
    onImport(parsed.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from a product link</CardTitle>
        <Badge dot={false}>Optional</Badge>
      </CardHeader>
      <CardContent className="gap-1.5">
        <FieldLabel htmlFor={inputId}>Product page link</FieldLabel>
        <form
          className="flex gap-2 max-sm:flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          noValidate
        >
          <Input
            id={inputId}
            type="url"
            inputMode="url"
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={`${inputId}-hint`}
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={!url.trim() || importing || !online}
            aria-busy={importing}
            className="max-sm:w-full"
          >
            {importing ? <Spinner /> : null}
            {importing ? 'Importing…' : 'Import'}
          </Button>
        </form>
        {error ? (
          <FieldError id={`${inputId}-hint`}>{error}</FieldError>
        ) : (
          <FieldHint id={`${inputId}-hint`}>
            We fill empty fields only. Anything you typed stays.
          </FieldHint>
        )}
        {result ? (
          <ImportBanner result={result} clearing={clearing} onClear={onClear} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function ImportBanner({
  result,
  clearing,
  onClear,
}: {
  result: ImportResult;
  clearing: boolean;
  onClear: () => void;
}) {
  if (result.outcome === ImportOutcome.NotAllowed) {
    return (
      <Alert variant="warning" className="mt-3">
        <TriangleAlertIcon />
        <AlertContent>
          <AlertTitle>We can’t import from this site.</AlertTitle>{' '}
          <AlertDescription>
            Enter the details below. Manual entry always works.
          </AlertDescription>
        </AlertContent>
      </Alert>
    );
  }

  if (result.outcome === ImportOutcome.Failed) {
    return (
      <Alert variant="danger" role="alert" className="mt-3">
        <CircleAlertIcon />
        <AlertContent>
          <AlertTitle>We couldn’t import from that link.</AlertTitle>{' '}
          <AlertDescription>
            The page didn’t respond or had no product details. Enter the
            details below; nothing you typed changed.
          </AlertDescription>
        </AlertContent>
      </Alert>
    );
  }

  const total = result.filled.length + result.missing.length;
  const complete = result.outcome === ImportOutcome.Filled;
  const missing = result.missing.map((field) => FIELD_NAMES[field]);

  return (
    <Alert variant={complete ? 'success' : 'info'} className="mt-3">
      {complete ? <CircleCheckIcon /> : <InfoIcon />}
      <AlertContent>
        <AlertTitle>
          Imported {result.filled.length} of {Math.max(total, result.filled.length)}{' '}
          fields from {result.host}.
        </AlertTitle>
        {missing.length > 0 ? (
          <>
            {' '}
            <AlertDescription>
              Not found: {missing.join(', ')}. Fill those in below.
            </AlertDescription>
          </>
        ) : null}
      </AlertContent>
      {result.filled.length > 0 ? (
        <AlertAction>
          <Button size="sm" variant="ghost" onClick={onClear} disabled={clearing}>
            {clearing ? <Spinner /> : null}
            Clear imported values
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
