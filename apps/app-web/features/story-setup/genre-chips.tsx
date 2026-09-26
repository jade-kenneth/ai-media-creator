'use client';

import { CheckIcon } from 'lucide-react';
import { useRef } from 'react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { GENRE_LABEL, GENRES } from '@/lib/studios';
import type { StoryGenre } from '@/react-query/generated__types';

/**
 * The genre radio chips. Nothing is chosen on a new story, so unlike
 * `ChoiceGroup` tabbing into the group only focuses a chip (APG radio group
 * with no checked radio); arrow keys, Home/End, Space and clicks select.
 */
export function GenreChips({
  value,
  onValueChange,
  disabled,
  describedBy,
}: {
  value: StoryGenre | null;
  onValueChange: (genre: StoryGenre) => void;
  disabled: boolean;
  describedBy?: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  // The last genre sent, so a focus and a click on one chip select it once.
  const sent = useRef<StoryGenre | null>(null);

  const select = (next: string) => {
    const genre = GENRES.find((candidate) => candidate === next);

    if (!genre || genre === value || genre === sent.current) return;
    sent.current = genre;
    onValueChange(genre);
  };

  return (
    <ToggleGroup
      ref={groupRef}
      type="single"
      variant="chip"
      value={value ?? ''}
      onValueChange={select}
      aria-label="Genre"
      aria-describedby={describedBy}
      disabled={disabled}
    >
      {GENRES.map((genre) => (
        <ToggleGroupItem
          key={genre}
          value={genre}
          onFocus={(event) => {
            // Focus arriving from another chip is arrow-key movement.
            const from = event.relatedTarget;
            if (from instanceof Node && groupRef.current?.contains(from)) {
              select(genre);
            }
          }}
        >
          {genre === value ? (
            <CheckIcon strokeWidth={2.5} aria-hidden="true" />
          ) : null}
          {GENRE_LABEL[genre]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
