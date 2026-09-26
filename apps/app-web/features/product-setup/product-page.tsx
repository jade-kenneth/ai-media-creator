'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRightIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import { StepPage, SaveFailedBanner } from '@/features/project-workflow/step-page';
import { useAutosave } from '@/features/project-workflow/use-autosave';
import { useProject } from '@/features/project-workflow/workflow-state';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { FIELD_SOURCE_BADGE } from '@/lib/studio/labels';
import { factsQueryKeys, useContinueToFactsMutation } from '@/react-query/facts/facts-operations';
import {
  FieldSource,
  ProductField,
  ProjectStepKey,
  type ImportProductMutation,
  type UpdateProductInput,
} from '@/react-query/generated__types';
import {
  projectsQueryKeys,
  useClearImportedProductValuesMutation,
  useImportProductMutation,
  useUpdateProductMutation,
  type ProjectDetail,
} from '@/react-query/projects/projects-operations';

import { ImportCard } from './import-card';
import { MediaCard } from './media-card';
import { ProductDetailsCard } from './product-details-card';
import {
  continueSchema,
  productFormSchema,
  type ProductFormValues,
} from './product-form.schema';

type ProductPatch = Omit<UpdateProductInput, 'projectId'>;

function toFormValues(project: ProjectDetail): ProductFormValues {
  const { product } = project;

  return {
    title: product.title ?? '',
    category: product.category ?? '',
    price: product.pricePhp === null || product.pricePhp === undefined ? '' : String(product.pricePhp),
    description: product.description ?? '',
    affiliateUrl: product.affiliateUrl ?? '',
    features: product.features.map((feature) => ({ id: feature.id, text: feature.text })),
  };
}

/** Turns valid form values into the API's partial update. */
function toPatch(values: ProductFormValues, fields: Set<keyof ProductFormValues>): ProductPatch {
  const patch: ProductPatch = {};
  const text = (value: string) => value.trim() || null;

  if (fields.has('title')) patch.title = text(values.title);
  if (fields.has('category')) patch.category = text(values.category);
  if (fields.has('description')) patch.description = text(values.description);
  if (fields.has('affiliateUrl')) patch.affiliateUrl = text(values.affiliateUrl);
  if (fields.has('price')) patch.pricePhp = values.price.trim() ? Number(values.price) : null;
  if (fields.has('features')) {
    patch.features = values.features.map((feature) => ({ id: feature.id, text: feature.text }));
  }

  return patch;
}

function toProductField(name: string): keyof ProductFormValues | null {
  if (name.startsWith('features')) return 'features';

  switch (name) {
    case 'title':
    case 'category':
    case 'price':
    case 'description':
    case 'affiliateUrl':
      return name;
    default:
      return null;
  }
}

/** Product (Design Reference §5.5). */
export function ProductPage() {
  const project = useProject();
  const router = useRouter();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const [continueAttempted, setContinueAttempted] = useState(false);
  const [sessionImport, setSessionImport] = useState<
    ImportProductMutation['importProduct'] | null
  >(null);
  const applyingServerValues = useRef(false);
  const [initialValues] = useState(() => toFormValues(project));

  useOfflineDetail('Changes will save when you reconnect.');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    mode: 'onTouched',
    defaultValues: initialValues,
  });

  const setProject = useCallback(
    (next: ProjectDetail) =>
      queryClient.setQueryData(projectsQueryKeys.detail(next.id), { project: next }),
    [queryClient],
  );

  const updateProduct = useUpdateProductMutation();
  const autosave = useAutosave<ProductPatch>({
    source: 'product',
    save: async (patch) => {
      const data = await updateProduct.mutateAsync({
        input: { projectId: project.id, ...patch },
      });
      setProject(data.updateProduct);
    },
  });

  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ name, values }) => {
        if (!name || applyingServerValues.current) return;

        const field = toProductField(name);
        if (!field) return;

        const valid = productFormSchema.shape[field].safeParse(values[field]).success;

        if (valid) autosave.schedule(toPatch(values, new Set([field])));
      },
    });
  }, [autosave, form]);

  /** Writes server values into the form without triggering another save. */
  const applyServerValues = (next: ProjectDetail, fields: ProductField[]) => {
    const values = toFormValues(next);
    const map: Partial<Record<ProductField, keyof ProductFormValues>> = {
      [ProductField.Title]: 'title',
      [ProductField.Category]: 'category',
      [ProductField.Price]: 'price',
      [ProductField.Description]: 'description',
      [ProductField.Features]: 'features',
    };

    applyingServerValues.current = true;
    for (const field of fields) {
      const key = map[field];
      if (key) form.setValue(key, values[key], { shouldDirty: false });
    }
    applyingServerValues.current = false;
  };

  const importProduct = useImportProductMutation({
    onSuccess: ({ importProduct: result }) => {
      setProject(result.project);
      applyServerValues(result.project, result.filled);
      setSessionImport(result);
    },
    onError: (error) => toast.error(error.message),
  });

  const clearImported = useClearImportedProductValuesMutation({
    onSuccess: ({ clearImportedProductValues }) => {
      const cleared = project.product.fieldSources
        .filter((entry) => entry.source === FieldSource.Imported)
        .map((entry) => entry.field);
      setProject(clearImportedProductValues);
      applyServerValues(clearImportedProductValues, [...cleared, ProductField.Features]);
      setSessionImport(null);
      toast.success('Imported values cleared.');
    },
    onError: (error) => toast.error(error.message),
  });

  const continueToFacts = useContinueToFactsMutation();
  const [continuing, setContinuing] = useState(false);

  const handleContinue = async () => {
    if (continuing) return;

    setContinueAttempted(true);
    const values = form.getValues();
    const parsed = continueSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const name = issue.path.join('.') as Parameters<typeof form.setError>[0];
        form.setError(name, { message: issue.message }, { shouldFocus: true });
      }
      return;
    }

    setContinuing(true);

    try {
      const saved = await updateProduct.mutateAsync({
        input: {
          projectId: project.id,
          ...toPatch(values, new Set(['title', 'category', 'price', 'description', 'affiliateUrl', 'features'])),
        },
      });
      setProject(saved.updateProduct);
      const next = await continueToFacts.mutateAsync({ projectId: project.id });
      setProject(next.continueToFacts);
      await queryClient.invalidateQueries({ queryKey: factsQueryKeys.list(project.id) });
      router.push(`/projects/${project.id}/facts`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'That didn’t save. Try again.');
      setContinuing(false);
    }
  };

  const [title, affiliateUrl] = useWatch({
    control: form.control,
    name: ['title', 'affiliateUrl'],
  });
  const missingRequired = !title.trim() || !affiliateUrl.trim();

  return (
    <StepPage
      step={ProjectStepKey.Product}
      title="Product"
      subtitle="Tell us what you’re promoting. Manual entry always works; importing from a link just fills fields faster."
      autosave
      asideWidth="280"
      banners={<SaveFailedBanner />}
      aside={
        <Card>
          <CardHeader>
            <CardTitle>Where values come from</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {(
              [
                [FieldSource.Imported, 'Filled from the product link. Check it; listings aren’t proof.'],
                [FieldSource.Creator, 'Typed by you.'],
                [FieldSource.Edited, 'Imported, then changed by you.'],
              ] as const
            ).map(([source, text]) => (
              <div key={source} className="flex flex-col items-start gap-1">
                <Badge variant={FIELD_SOURCE_BADGE[source].tone}>
                  {FIELD_SOURCE_BADGE[source].label}
                </Badge>
                <p className="t-sm text-ink-2">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      }
      footer={{
        back: { label: 'Projects', href: '/projects' },
        reason:
          missingRequired && (continueAttempted || project.product.title)
            ? 'Add a product title and affiliate link to continue'
            : null,
        actions: (
          <Button
            onClick={() => void handleContinue()}
            disabled={!online || continuing}
            aria-busy={continuing}
          >
            {continuing ? <Spinner /> : null}
            {continuing ? 'Saving…' : 'Continue to facts'}
            {continuing ? null : <ArrowRightIcon data-icon="inline-end" />}
          </Button>
        ),
      }}
    >
      <ImportCard
        project={project}
        sessionResult={sessionImport}
        importing={importProduct.isPending}
        clearing={clearImported.isPending}
        online={online}
        onImport={(url) => {
          if (importProduct.isPending) return;
          importProduct.mutate({ input: { projectId: project.id, url } });
        }}
        onClear={() => {
          if (clearImported.isPending) return;
          clearImported.mutate({ projectId: project.id });
        }}
      />
      <ProductDetailsCard form={form} project={project} onBlurField={autosave.flush} />
      <MediaCard projectId={project.id} online={online} />
    </StepPage>
  );
}
