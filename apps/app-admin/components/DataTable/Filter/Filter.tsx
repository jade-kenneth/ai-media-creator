'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/utils';
import { RotateCcwIcon, SlidersHorizontalIcon } from 'lucide-react';

import { useDataTableContext } from '../DataTableContext';
import { Combobox } from './Combobox';
import { DatePicker } from './DatePicker';
import { DateRangePicker } from './DateRangePicker';
import { DualDateRangePicker } from './DualDateRangePicker';
import {
  FilterProvider,
  useFilter,
  useFilterContext,
  type UseFilterProps,
} from './FilterContext';
import { Input } from './Input';
import { MultiCombobox } from './MultiCombobox';
import { MultiSelect } from './MultiSelect';
import { NumberRangePicker } from './NumberRangePicker';
import { Select } from './Select';
import { Switch } from './Switch';

interface FilterProps extends UseFilterProps {
  children: React.ReactNode;
}

export function Filter({ children, ...props }: FilterProps) {
  const filter = useFilter(props);

  return <FilterProvider value={filter}>{children}</FilterProvider>;
}

export function FilterTrigger() {
  const datatable = useDataTableContext();
  const filter = useFilterContext();

  if (!datatable.filter.enabled) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => filter.setOpen(true)}
      disabled={datatable.table.loading}
      data-testid="filter-trigger"
    >
      <SlidersHorizontalIcon data-icon="inline-start" />
      Filters
    </Button>
  );
}

export function FilterContent() {
  const datatable = useDataTableContext();
  const filter = useFilterContext();

  if (!datatable.filter.enabled) return null;

  const resetValues = Object.fromEntries(
    datatable.filter.items.map((item) => [item.id, undefined]),
  );

  return (
    <Sheet open={filter.open} onOpenChange={filter.setOpen}>
      <SheetContent side="right" className="w-full max-w-2xl">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Refine the visible rows with typed filters.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
          {datatable.filter.items.map((item, index) => {
            if (!item.enabled) {
              return null;
            }

            const correspondingColumn = datatable.table.columns.find(
              (column) => column.id === item.id,
            );

            if (correspondingColumn?.hidden === true) {
              return null;
            }

            const value =
              datatable.filter.value[
                item.id as keyof typeof datatable.filter.value
              ];

            let content: React.ReactNode;

            switch (item.type) {
              case 'TEXT':
              case 'EMAIL':
              case 'URL':
                content = (
                  <Input
                    type={
                      item.type === 'URL'
                        ? 'url'
                        : item.type === 'EMAIL'
                          ? 'email'
                          : 'text'
                    }
                    value={value as string | undefined}
                    onChange={(nextValue) => {
                      datatable.filter.setValue({ [item.id]: nextValue });
                    }}
                    label={item.label}
                    placeholder={item.placeholder}
                    clearable={item.clearable}
                    disabled={item.disabled}
                  />
                );
                break;
              case 'SELECT':
                content = (
                  <Select
                    key={String(value ?? '')}
                    value={value as string | undefined}
                    onChange={(nextValue) => {
                      datatable.filter.setValue({ [item.id]: nextValue });
                    }}
                    label={item.label}
                    options={item.options}
                    clearable={item.clearable}
                    disabled={item.disabled}
                    placeholder={item.placeholder}
                  />
                );
                break;
              case 'MULTI_SELECT':
                content = (
                  <MultiSelect
                    value={(value as string[] | undefined) ?? []}
                    onChange={(nextValue) => {
                      datatable.filter.setValue({ [item.id]: nextValue });
                    }}
                    label={item.label}
                    options={item.options}
                    clearable={item.clearable}
                    disabled={item.disabled}
                    placeholder={item.placeholder}
                  />
                );
                break;
              case 'ASYNC_MULTI_SELECT':
                content = (
                  <MultiCombobox
                    value={(value as string[] | undefined) ?? []}
                    onChange={(nextValue) => {
                      datatable.filter.setValue({ [item.id]: nextValue });
                    }}
                    placeholder={item.placeholder}
                    label={item.label}
                    options={item.options}
                    clearable={item.clearable}
                    disabled={item.disabled}
                    clearOnSelect={item.clearOnSelect}
                  />
                );
                break;
              case 'ASYNC_SELECT':
                content = (
                  <Combobox
                    value={value as string | undefined}
                    onChange={(nextValue) => {
                      datatable.filter.setValue({ [item.id]: nextValue });
                    }}
                    placeholder={item.placeholder}
                    label={item.label}
                    options={item.options}
                    clearable={item.clearable}
                    disabled={item.disabled}
                  />
                );
                break;
              case 'DATE':
              case 'DATETIME':
                content = (
                  <DatePicker
                    type={item.type === 'DATETIME' ? 'datetime' : 'date'}
                    label={item.label}
                    value={value as Date | null | undefined}
                    onChange={(nextValue) => {
                      datatable.filter.setValue({ [item.id]: nextValue });
                    }}
                    clearable={item.clearable}
                    disabled={item.disabled}
                    placeholder={item.placeholder}
                  />
                );
                break;
              case 'DATE_RANGE':
              case 'DATETIME_RANGE':
                content = item.dual ? (
                  <DualDateRangePicker
                    type={item.type === 'DATETIME_RANGE' ? 'datetime' : 'date'}
                    label={item.label}
                    placeholder={item.placeholder}
                    value={value as any}
                    onChange={(nextValue) => {
                      datatable.filter.setValue({ [item.id]: nextValue });
                    }}
                    clearable={item.clearable}
                    disabled={item.disabled}
                    presets={item.presets}
                  />
                ) : (
                  <DateRangePicker
                    type={item.type === 'DATETIME_RANGE' ? 'datetime' : 'date'}
                    label={item.label}
                    placeholder={item.placeholder}
                    value={value as any}
                    onChange={(nextValue) => {
                      datatable.filter.setValue({ [item.id]: nextValue });
                    }}
                    clearable={item.clearable}
                    disabled={item.disabled}
                  />
                );
                break;
              case 'NUMBER_RANGE':
                content = (
                  <NumberRangePicker
                    min={item.min}
                    max={item.max}
                    value={value as any}
                    onChange={(nextValue) => {
                      datatable.filter.setValue({ [item.id]: nextValue });
                    }}
                    hint={item.hint}
                    label={item.label}
                    disabled={item.disabled}
                  />
                );
                break;
              case 'TOGGLE':
                content = (
                  <Switch
                    label={item.label}
                    value={Boolean(value)}
                    onChange={(nextValue) => {
                      datatable.filter.setValue({
                        [item.id]: nextValue,
                      });
                    }}
                    disabled={item.disabled}
                  />
                );
                break;
              default:
                return null;
            }

            const nextSibling = datatable.filter.items.at(index + 1);

            return (
              <div
                key={`${item.id}-${index}`}
                className={cn(
                  'mt-4 rounded-lg bg-card px-4 py-3 first:mt-0',
                  item.attached && 'mt-0 rounded-t-none pt-0',
                  nextSibling?.attached && 'rounded-b-none',
                )}
              >
                {content}
              </div>
            );
          })}
        </div>

        <Separator />

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              datatable.filter.setValue(resetValues);
            }}
          >
            <RotateCcwIcon data-icon="inline-start" />
            Clear all
          </Button>
          <Button type="button" onClick={() => filter.setOpen(false)}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
