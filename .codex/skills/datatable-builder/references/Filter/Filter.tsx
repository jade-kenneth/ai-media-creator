import { Settings04Icon, XCloseIcon } from '@untitled-theme/icons-react';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';
import { Button } from '~/components/ui/Button';
import { Icon } from '~/components/ui/Icon';
import { Presence } from '~/components/ui/Presence';
import { useDataTableContext } from '../DataTableContext';
import { Combobox } from './Combobox';
import { DatePicker } from './DatePicker';
import { DateRangePicker } from './DateRangePicker';
import { DualDateRangePicker } from './DualDateRangePicker';
import {
  FilterProvider,
  useFilter,
  useFilterContext,
  UseFilterProps,
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
      size="sm"
      variant="subtle"
      onClick={() => filter.setOpen((v) => !v)}
      disabled={datatable.table.loading}
      data-state={filter.open ? 'open' : 'closed'}
      data-testid="filter-trigger"
    >
      <Icon>
        <Settings04Icon />
      </Icon>
      Filters
    </Button>
  );
}

export function FilterContent() {
  const datatable = useDataTableContext();
  const filter = useFilterContext();

  if (!datatable.filter.enabled) return null;

  return (
    <Presence
      present={filter.open}
      className="shrink-0 overflow-hidden [--width:425px] ui-open:animate-collapse-x-in ui-closed:animate-collapse-x-out"
    >
      <div className="flex max-w-[425px] min-w-[425px] flex-col rounded-xl border border-[#EAECF0] bg-white pb-4 dark:border-[#26272B] dark:bg-[#0A1117] inplay:border-[#26272B] inplay:bg-[#090D1C] crazywin:border-[#26272B] crazywin:bg-[#0A1117] happybingo:border-[#333741] happybingo:bg-[#090D1C]">
        <div className="mb-4 flex items-center justify-between border-b border-[#EAECF0] px-4 py-3 text-[#CECFD2] dark:border-[#26272B] inplay:border-[#26272B] crazywin:border-[#26272B] happybingo:border-[#333741]">
          <h2 className="text-sm font-semibold text-[#CECFD2] light:text-[#475467]">
            Filters
          </h2>
          <button type="button" onClick={() => filter.setOpen(false)}>
            <Icon className="text-[#85888E]">
              <XCloseIcon />
            </Icon>
          </button>
        </div>

        <div className="flex flex-col px-4">
          {datatable.filter.items.map((item, index) => {
            if (!item.enabled) {
              return null;
            }

            const correspondingColumn = datatable.table.columns.find(
              (col) => col.id === item.id,
            );

            if (
              typeof correspondingColumn !== 'undefined' &&
              correspondingColumn.hidden === true
            ) {
              return null;
            }

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
                    value={datatable.filter.value[item.id]}
                    onChange={(value) => {
                      datatable.filter.setValue({ [item.id]: value });
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
                    /* fixes issue where "clear" button remains visible */
                    key={datatable.filter.value[item.id]}
                    value={datatable.filter.value[item.id]}
                    onChange={(value) => {
                      datatable.filter.setValue({ [item.id]: value });
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
                    value={datatable.filter.value[item.id]}
                    onChange={(value) => {
                      datatable.filter.setValue({ [item.id]: value });
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
                    value={datatable.filter.value[item.id]}
                    onChange={(value) => {
                      datatable.filter.setValue({ [item.id]: value });
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
                    value={datatable.filter.value[item.id]}
                    onChange={(value) => {
                      datatable.filter.setValue({ [item.id]: value });
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
                    value={datatable.filter.value[item.id]}
                    onChange={(value) => {
                      datatable.filter.setValue({ [item.id]: value });
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
                    value={datatable.filter.value[item.id]}
                    onChange={(value) => {
                      datatable.filter.setValue({ [item.id]: value });
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
                    value={datatable.filter.value[item.id]}
                    onChange={(value) => {
                      datatable.filter.setValue({ [item.id]: value });
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
                    value={datatable.filter.value[item.id]}
                    onChange={(value) => {
                      datatable.filter.setValue({ [item.id]: value });
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
                    value={datatable.filter.value[item.id]}
                    onChange={(value) => {
                      datatable.filter.setValue({
                        [item.id]: value,
                      });
                    }}
                    disabled={item.disabled}
                  />
                );
                break;
              default:
                console.warn('Unknown filter type');
                return null;
            }

            const nextSibling = datatable.filter.items.at(index + 1);

            return (
              <div
                key={item.id + index}
                className={twMerge(
                  'mt-4 rounded-lg bg-[#F9FAFB] px-4 py-3 first:mt-0 dark:bg-[#161b2680] inplay:bg-[#0E1223] crazywin:bg-[#161b2680] happybingo:bg-[#161B26]',
                  item.attached && 'mt-0 rounded-t-none pt-0',
                  nextSibling?.attached && 'rounded-b-none',
                )}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </Presence>
  );
}
