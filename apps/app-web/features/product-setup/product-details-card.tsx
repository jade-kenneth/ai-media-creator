'use client';

import { PlusIcon, XIcon } from 'lucide-react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';

import { FieldError, FieldHint, FieldLabel } from '@/components/studio/field-label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import { FIELD_SOURCE_BADGE } from '@/lib/studio/labels';
import { FieldSource, ProductField } from '@/react-query/generated__types';
import type { ProjectDetail } from '@/react-query/projects/projects-operations';

import { newFeatureId, type ProductFormValues } from './product-form.schema';

function SourceBadge({ source }: { source: FieldSource | undefined }) {
  if (!source) return null;

  const badge = FIELD_SOURCE_BADGE[source];

  return <Badge variant={badge.tone}>{badge.label}</Badge>;
}

export function ProductDetailsCard({
  form,
  project,
  onBlurField,
}: {
  form: UseFormReturn<ProductFormValues>;
  project: ProjectDetail;
  onBlurField: () => void;
}) {
  const features = useFieldArray({ control: form.control, name: 'features' });
  const errors = form.formState.errors;
  const sources = new Map(
    project.product.fieldSources.map((entry) => [entry.field, entry.source]),
  );
  const description = form.watch('description');
  const values = form.getValues();
  const has = (value: string) => value.trim().length > 0;

  const field = <Name extends 'title' | 'category' | 'description' | 'affiliateUrl'>(
    name: Name,
  ) => {
    const registration = form.register(name);

    return {
      ...registration,
      onBlur: async (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        await registration.onBlur(event);
        onBlurField();
      },
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `product-${name}-error` : `product-${name}-hint`,
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1.5">
          <FieldLabel
            htmlFor="product-title"
            requirement="required"
            badge={has(values.title) ? <SourceBadge source={sources.get(ProductField.Title)} /> : null}
          >
            Product title
          </FieldLabel>
          <Input id="product-title" maxLength={120} {...field('title')} />
          {errors.title ? (
            <FieldError id="product-title-error">{errors.title.message}</FieldError>
          ) : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel
              htmlFor="product-category"
              requirement="optional"
              badge={has(values.category) ? <SourceBadge source={sources.get(ProductField.Category)} /> : null}
            >
              Category
            </FieldLabel>
            <Input
              id="product-category"
              placeholder="e.g. Kitchen & Dining"
              maxLength={80}
              {...field('category')}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel
              htmlFor="product-price"
              requirement="optional"
              badge={has(values.price) ? <SourceBadge source={sources.get(ProductField.Price)} /> : null}
            >
              Price
            </FieldLabel>
            <InputGroup>
              <InputGroupAddon className="border-r border-border-strong bg-surface-sunken px-3">
                ₱
              </InputGroupAddon>
              <InputGroupInput
                id="product-price"
                inputMode="decimal"
                aria-invalid={Boolean(errors.price)}
                aria-describedby={errors.price ? 'product-price-error' : undefined}
                {...form.register('price', { onBlur: onBlurField })}
              />
            </InputGroup>
            {errors.price ? (
              <FieldError id="product-price-error">{errors.price.message}</FieldError>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel
            htmlFor="product-description"
            requirement="optional"
            badge={has(values.description) ? <SourceBadge source={sources.get(ProductField.Description)} /> : null}
          >
            Description
          </FieldLabel>
          <Textarea
            id="product-description"
            rows={4}
            maxLength={2000}
            className="min-h-28"
            {...field('description')}
          />
          <p className="t-mono self-end text-caption text-ink-3" aria-live="off">
            {description.length} / 2,000
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel
            htmlFor="product-affiliateUrl"
            requirement="required"
            badge={has(values.affiliateUrl) ? <SourceBadge source={sources.get(ProductField.AffiliateUrl)} /> : null}
          >
            Affiliate link
          </FieldLabel>
          <Input
            id="product-affiliateUrl"
            type="url"
            inputMode="url"
            placeholder="https://"
            {...field('affiliateUrl')}
          />
          {errors.affiliateUrl ? (
            <FieldError id="product-affiliateUrl-error">{errors.affiliateUrl.message}</FieldError>
          ) : (
            <FieldHint id="product-affiliateUrl-hint">
              The link you earn commission from. It goes into your creator brief.
            </FieldHint>
          )}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="contents">
            <FieldLabel
              htmlFor={features.fields[0] ? `product-feature-${features.fields[0].id}` : 'product-add-feature'}
              requirement="optional"
              badge={features.fields.length > 0 ? <SourceBadge source={FieldSource.Creator} /> : null}
            >
              Key features
            </FieldLabel>
          </legend>
          <FieldHint>One per line item. Each becomes a fact you’ll review next.</FieldHint>
          <ul className="flex flex-col gap-2">
            {features.fields.map((item, index) => (
              <li key={item.id} className="flex items-center gap-2">
                <Input
                  id={`product-feature-${item.id}`}
                  aria-label={`Feature ${index + 1}`}
                  maxLength={160}
                  {...form.register(`features.${index}.text`, { onBlur: onBlurField })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove feature: ${form.getValues(`features.${index}.text`) || `feature ${index + 1}`}`}
                  onClick={() => features.remove(index)}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              id="product-add-feature"
              type="button"
              variant="ghost"
              disabled={features.fields.length >= 12}
              onClick={() => {
                features.append({ id: newFeatureId(), text: '' });
              }}
              className="-ml-3 self-start max-sm:ml-0"
            >
              <PlusIcon data-icon="inline-start" />
              Add a feature
            </Button>
            {features.fields.length >= 12 ? (
              <FieldHint>You can add up to 12 features.</FieldHint>
            ) : null}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}
