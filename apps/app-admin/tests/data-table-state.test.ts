import assert from 'node:assert/strict';
import test from 'node:test';

import type { FilterEntries } from '../components/DateTable/types.ts';
import {
  buildFilterValues,
  compareValues,
  isFilterActive,
  matchesFilterValue,
} from '../components/DateTable/utils/table-state.ts';

interface MockRow {
  age: number;
  createdAt: string;
  isActive: boolean;
  name: string;
  status: string;
}

const filters = {
  name: {
    type: 'text',
    label: 'Name',
  },
  status: {
    type: 'select',
    label: 'Status',
    options: [
      {
        label: 'Active',
        value: 'ACTIVE',
      },
      {
        label: 'Inactive',
        value: 'INACTIVE',
      },
    ],
  },
  tags: {
    type: 'multi-select',
    label: 'Tags',
    options: [
      {
        label: 'Featured',
        value: 'featured',
      },
    ],
  },
  createdAt: {
    type: 'date-range',
    label: 'Created',
  },
  age: {
    type: 'number-range',
    label: 'Age',
  },
  isActive: {
    type: 'toggle',
    label: 'Account active',
  },
} satisfies FilterEntries<MockRow>;

test('buildFilterValues returns sensible defaults and keeps overrides', () => {
  const values = buildFilterValues(filters, {
    status: 'ACTIVE',
    isActive: true,
  });

  assert.deepEqual(values, {
    age: {
      min: null,
      max: null,
    },
    createdAt: {
      from: null,
      to: null,
    },
    isActive: true,
    name: '',
    status: 'ACTIVE',
    tags: [],
  });
});

test('isFilterActive handles strings, collections, booleans, and nested objects', () => {
  assert.equal(isFilterActive(''), false);
  assert.equal(isFilterActive(' member '), true);
  assert.equal(isFilterActive([]), false);
  assert.equal(isFilterActive(['featured']), true);
  assert.equal(isFilterActive(false), false);
  assert.equal(isFilterActive(true), true);
  assert.equal(
    isFilterActive({
      from: null,
      to: '2026-04-01',
    }),
    true,
  );
});

test('matchesFilterValue supports text, range, and toggle filters', () => {
  const row: MockRow = {
    age: 28,
    createdAt: '2026-04-10T08:00:00.000Z',
    isActive: true,
    name: 'Maria Santos',
    status: 'ACTIVE',
  };

  assert.equal(matchesFilterValue(row, filters.name, 'name', 'maria'), true);
  assert.equal(
    matchesFilterValue(row, filters.createdAt, 'createdAt', {
      from: '2026-04-01T00:00:00.000Z',
      to: '2026-04-30T23:59:59.999Z',
    }),
    true,
  );
  assert.equal(
    matchesFilterValue(row, filters.age, 'age', {
      min: 18,
      max: 30,
    }),
    true,
  );
  assert.equal(
    matchesFilterValue(row, filters.isActive, 'isActive', true),
    true,
  );
  assert.equal(
    matchesFilterValue(row, filters.age, 'age', {
      min: 30,
      max: 40,
    }),
    false,
  );
});

test('compareValues sorts numbers, dates, and natural strings correctly', () => {
  assert.equal(compareValues(10, 2) > 0, true);
  assert.equal(
    compareValues(
      new Date('2026-04-11T00:00:00.000Z'),
      new Date('2026-04-10T00:00:00.000Z'),
    ) > 0,
    true,
  );
  assert.equal(compareValues('Item 2', 'Item 10') < 0, true);
});
