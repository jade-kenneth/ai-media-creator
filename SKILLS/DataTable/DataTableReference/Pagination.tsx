import { createListCollection, Portal } from '@ark-ui/react';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@untitled-theme/icons-react';
import { clamp } from 'es-toolkit';
import { twMerge } from 'tailwind-merge';
import { SpinnerIcon } from '~/components/icons/SpinnerIcon';
import { Button } from '~/components/ui/Button';
import { Select } from '~/components/ui/Select';
import { numberFormatter } from '~/utils/numberFormatter';
import { safeParseFloat } from '~/utils/safeParseFloat';
import { Show } from '../Show';
import { useDataTableContext } from './DataTableContext';

export function Pagination() {
  const datatable = useDataTableContext();
  const collection = createListCollection({
    items: datatable.pagination.pageSizes,
    itemToValue: (item) => item.toString(),
    itemToString: (item) => `${item} entries`,
  });

  if (!datatable.pagination.enabled) return null;

  const start =
    datatable.pagination.count <= 0
      ? 0
      : clamp(
          datatable.pagination.page * datatable.pagination.pageSize -
            datatable.pagination.pageSize,
          1,
          Infinity,
        );

  const until = clamp(
    datatable.pagination.page * datatable.pagination.pageSize,
    0,
    datatable.pagination.count,
  );

  const loading = datatable.table.loading || datatable.pagination.loading;

  return (
    <div className="flex items-center gap-3 border-t border-[#26272B] py-4 pr-4 pl-6 light:border-[#EAECF0] inplay:border-[#26272B] happybingo:border-[#1F242F]">
      <Show
        when={!datatable.pagination.loading}
        fallback={
          <div
            className={twMerge(
              'h-3',
              'w-24',
              'rounded-full',
              'bg-[#EAECF0]',
              'animate-pulse',
              'dark:animate-skeleton',
              'dark:bg-[linear-gradient(90deg,#347C96_0%,#0A2C38_46.23%,#347C96_100%)]',
              'dark:bg-position-[0%_0%]',
              'dark:bg-size-[200%_100%]',
              'inplay:animate-skeleton',
              'inplay:bg-[linear-gradient(90deg,#347C96_0%,#0A2C38_46.23%,#347C96_100%)]',
              'inplay:bg-position-[0%_0%]',
              'inplay:bg-size-[200%_100%]',
              'crazywin:animate-skeleton',
              'crazywin:bg-[linear-gradient(90deg,#347C96_0%,#0A2C38_46.23%,#347C96_100%)]',
              'crazywin:bg-position-[0%_0%]',
              'crazywin:bg-size-[200%_100%]',
            )}
          />
        }
      >
        <span
          role="alert"
          aria-live="polite"
          className="text-sm font-medium text-[#CECFD2] light:text-[#344054] inplay:text-[#CECFD2] happybingo:text-[#61646C]"
        >
          Showing{' '}
          {numberFormatter.format(start, {
            minDecimalPlaces: 0,
            maxDecimalPlaces: 0,
          })}
          -
          {numberFormatter.format(until, {
            minDecimalPlaces: 0,
            maxDecimalPlaces: 0,
          })}{' '}
          of{' '}
          {numberFormatter.format(datatable.pagination.count, {
            minDecimalPlaces: 0,
            maxDecimalPlaces: 0,
          })}{' '}
          results
        </span>
      </Show>

      <div className="grow" />

      <Show when={loading}>
        <SpinnerIcon className="mx-2 size-6 text-brand" />
      </Show>

      {collection.items.length > 0 && (
        <Select.Root
          collection={collection}
          size="sm"
          value={[datatable.pagination.pageSize.toString()]}
          onValueChange={(details) => {
            if (details.value.length <= 0) return;
            datatable.pagination.setPageSize(
              safeParseFloat(details.value[0], 10),
            );
          }}
          disabled={loading}
        >
          <Select.Trigger>
            <Select.ValueText className="font-semibold" />
            <Select.Indicator asChild>
              <ChevronDownIcon />
            </Select.Indicator>
          </Select.Trigger>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                <Select.ItemGroup>
                  {collection.items.map((item) => (
                    <Select.Item key={item} item={item}>
                      <Select.ItemText className="shrink-0 text-sm">
                        {collection.stringifyItem(item)}
                      </Select.ItemText>
                      <Select.ItemIndicator asChild>
                        <CheckIcon className="shrink-0" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.ItemGroup>
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      )}

      <div className="flex">
        <Button
          size="sm"
          variant="outline"
          colorScheme="gray"
          onClick={datatable.pagination.prev}
          disabled={loading || !datatable.pagination.hasPrevPage}
          className="rounded-r-none"
        >
          <ChevronLeftIcon className="size-5" />
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          colorScheme="gray"
          onClick={datatable.pagination.next}
          disabled={loading || !datatable.pagination.hasNextPage}
          className="rounded-l-none border-l-0"
        >
          Next
          <ChevronRightIcon className="size-5" />
        </Button>
      </div>
    </div>
  );
}
