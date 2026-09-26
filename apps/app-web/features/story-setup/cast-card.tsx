'use client';

import { PlusIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  useFormState,
  useWatch,
  type FieldPath,
  type UseFieldArrayReturn,
  type UseFormReturn,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STORY_LIMITS } from '@/lib/studios';

import { newCharacterId, type StoryFormValues } from './story-form.schema';

type CastFieldName = 'name' | 'role' | 'look';

const FIELDS: {
  key: CastFieldName;
  label: string;
  placeholder: string;
  max: number;
}[] = [
  { key: 'name', label: 'Name', placeholder: 'Name', max: STORY_LIMITS.name },
  {
    key: 'role',
    label: 'Who they are',
    placeholder: 'e.g. A nurse heading home after a night shift',
    max: STORY_LIMITS.role,
  },
  {
    key: 'look',
    label: 'Look',
    placeholder: 'e.g. 20s, yellow raincoat, short hair',
    max: STORY_LIMITS.look,
  },
];

/** Name · Who they are · Look · remove, at ≥ 768px; stacked below. */
const ROW_GRID =
  'md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start';

function CastError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="t-caption flex items-center gap-1.5 text-danger"
    >
      <span
        aria-hidden="true"
        className="inline-block size-1.5 rounded-full bg-danger"
      />
      {children}
    </p>
  );
}

/**
 * The Cast card (§3.23): up to 4 character rows. A row with no name stays on
 * screen but isn't saved; the page's autosave sends only named rows.
 */
export function CastCard({
  form,
  cast,
  disabled,
  onBlurField,
}: {
  form: UseFormReturn<StoryFormValues>;
  cast: UseFieldArrayReturn<StoryFormValues, 'cast'>;
  disabled: boolean;
  onBlurField: () => void;
}) {
  const rows = useWatch({ control: form.control, name: 'cast' });
  const { errors } = useFormState({ control: form.control, name: 'cast' });
  const addRef = useRef<HTMLButtonElement>(null);
  const focusAddNext = useRef(false);
  const full = cast.fields.length >= STORY_LIMITS.cast;

  // After a removal, focus moves to Add a character rather than the page.
  useEffect(() => {
    if (!focusAddNext.current) return;
    focusAddNext.current = false;
    addRef.current?.focus();
  }, [cast.fields.length]);

  /** Re-checks the other names a creator has already seen, for duplicates. */
  const recheckOtherNames = (changed: number) => {
    const names = cast.fields.flatMap((_, index) => {
      const name: FieldPath<StoryFormValues> = `cast.${index}.name`;
      const state = form.getFieldState(name);

      return index !== changed && (state.isTouched || state.error)
        ? [name]
        : [];
    });

    if (names.length > 0) void form.trigger(names);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast</CardTitle>
        <CardAction>
          <p className="t-mono t-sm text-ink-2">
            {cast.fields.length} of {STORY_LIMITS.cast}
            <span className="sr-only"> characters</span>
          </p>
        </CardAction>
      </CardHeader>
      <CardContent className="gap-4">
        <p className="t-sm text-ink-2">
          Who appears. We use their names in the lines and their look in AI
          clips.
        </p>

        {cast.fields.length === 0 ? (
          <p className="t-sm text-ink-3">
            No characters yet. A narrated story can go without one.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div
              aria-hidden="true"
              className={`hidden gap-2 md:grid ${ROW_GRID}`}
            >
              {FIELDS.map((field) => (
                <span key={field.key} className="t-label text-ink">
                  {field.label}
                </span>
              ))}
            </div>
            {cast.fields.map((field, index) => {
              const name = rows[index]?.name.trim() ?? '';
              const removeLabel = `Remove ${name || `character ${index + 1}`}`;
              const remove = (className: string) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={className}
                  aria-label={removeLabel}
                  disabled={disabled}
                  onClick={() => {
                    focusAddNext.current = true;
                    cast.remove(index);
                  }}
                >
                  <XIcon />
                </Button>
              );

              return (
                <div
                  key={field.id}
                  role="group"
                  aria-label={name || `Character ${index + 1}`}
                  className={`grid gap-2 max-md:rounded-md max-md:border max-md:border-border max-md:p-3 ${ROW_GRID}`}
                >
                  <div className="flex items-center justify-between gap-2 md:hidden">
                    <p className="t-label text-ink-2">Character {index + 1}</p>
                    {remove('-my-1 -mr-1')}
                  </div>
                  {FIELDS.map((column) => {
                    const id = `story-character-${field.id}-${column.key}`;
                    const error = errors.cast?.[index]?.[column.key]?.message;

                    return (
                      <div
                        key={column.key}
                        className="flex min-w-0 flex-col gap-1.5"
                      >
                        <Label htmlFor={id} className="md:sr-only">
                          {column.label}
                        </Label>
                        <Input
                          id={id}
                          maxLength={column.max}
                          placeholder={column.placeholder}
                          disabled={disabled}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? `${id}-error` : undefined}
                          {...form.register(`cast.${index}.${column.key}`, {
                            onBlur: onBlurField,
                            onChange:
                              column.key === 'name'
                                ? () => recheckOtherNames(index)
                                : undefined,
                          })}
                        />
                        {error ? (
                          <CastError id={`${id}-error`}>{error}</CastError>
                        ) : null}
                      </div>
                    );
                  })}
                  {remove('max-md:hidden md:mt-0.5 lg:mt-1')}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Button
            ref={addRef}
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            disabled={disabled || full}
            aria-describedby={full ? 'story-cast-full' : undefined}
            onClick={() => {
              if (full) return;
              cast.append(
                { id: newCharacterId(), name: '', role: '', look: '' },
                { focusName: `cast.${cast.fields.length}.name` },
              );
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Add a character
          </Button>
          {full ? (
            <p id="story-cast-full" className="t-caption text-ink-3">
              Up to {STORY_LIMITS.cast} characters.
            </p>
          ) : null}
        </div>
        <p className="t-caption text-ink-3">
          Fictional characters, played by you, by people who agreed, or by AI.
          Never a real public figure.
        </p>
      </CardContent>
    </Card>
  );
}
