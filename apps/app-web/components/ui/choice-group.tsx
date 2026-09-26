'use client';

import { CheckIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { ToggleGroup, ToggleGroupItem } from './toggle-group';

export interface ChoiceOption<Value extends string> {
  value: Value;
  label: ReactNode;
  /** Trailing content such as a mono count. */
  meta?: ReactNode;
  disabled?: boolean;
}

interface ChoiceGroupProps<Value extends string> {
  label: string;
  value: Value;
  options: ReadonlyArray<ChoiceOption<Value>>;
  onValueChange: (value: Value) => void;
  variant?: 'chip' | 'segment';
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  id?: string;
  'aria-describedby'?: string;
}

/**
 * A single-choice radio group (APG pattern) built on the Radix toggle group:
 * one tab stop, arrow keys move focus and select, a choice can't be cleared.
 * Chips show a check glyph when selected so selection isn't colour alone.
 */
export function ChoiceGroup<Value extends string>({
  label,
  value,
  options,
  onValueChange,
  variant = 'chip',
  disabled,
  className,
  itemClassName,
  id,
  'aria-describedby': describedBy,
}: ChoiceGroupProps<Value>) {
  const select = (next: string) => {
    const option = options.find((candidate) => candidate.value === next);

    if (!option || option.disabled || next === value) return;

    onValueChange(option.value);
  };

  return (
    <ToggleGroup
      id={id}
      type="single"
      variant={variant}
      value={value}
      onValueChange={select}
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      className={className}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          onFocus={() => select(option.value)}
          className={cn(itemClassName)}
        >
          {variant === 'chip' && option.value === value ? (
            <CheckIcon strokeWidth={2.5} aria-hidden="true" />
          ) : null}
          {option.label}
          {option.meta !== undefined ? (
            <span className="font-mono tabular-nums opacity-70">
              {option.meta}
            </span>
          ) : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
