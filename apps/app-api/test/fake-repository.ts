import type {
  RepositoryFilter,
  RepositoryQueryOptions,
} from '../src/libs/repository';

type Condition = {
  in?: unknown[];
  notIn?: unknown[];
  greaterThan?: unknown;
  greaterThanOrEqual?: unknown;
  lesserThan?: unknown;
};

function matches<T extends object>(
  record: T,
  filter: RepositoryFilter<T> | Record<string, unknown> = {},
): boolean {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = (record as Record<string, unknown>)[key];

    if (
      expected !== null &&
      typeof expected === 'object' &&
      !(expected instanceof Date) &&
      !Array.isArray(expected)
    ) {
      const condition = expected as Condition;
      if (condition.in && !condition.in.includes(actual)) return false;
      // Like MongoDB's $nin, a missing field is "not in" any list.
      if (condition.notIn?.includes(actual)) return false;
      if (
        condition.greaterThan !== undefined &&
        !((actual as number) > (condition.greaterThan as number))
      )
        return false;
      if (
        condition.greaterThanOrEqual !== undefined &&
        !((actual as number) >= (condition.greaterThanOrEqual as number))
      )
        return false;
      if (
        condition.lesserThan !== undefined &&
        !((actual as number) < (condition.lesserThan as number))
      )
        return false;
      return true;
    }

    return actual === expected;
  });
}

/**
 * An in-memory stand-in for the repository contract, for service specs.
 * Supports the equality, `in`, `notIn` and range conditions the services use.
 */
export function fakeRepository<T extends { id: string }>(seed: T[] = []) {
  const records: T[] = seed.map((record) => ({ ...record }));

  const select = (
    filter?: RepositoryFilter<T>,
    options?: RepositoryQueryOptions<T>,
  ) => {
    const found = records.filter((record) => matches(record, filter));
    const [[field, direction] = []] = Object.entries(options?.sort ?? {});

    if (field) {
      found.sort((a, b) => {
        const left = (a as Record<string, unknown>)[field] as number | string;
        const right = (b as Record<string, unknown>)[field] as number | string;
        const order = left < right ? -1 : left > right ? 1 : 0;
        return direction === 'DESC' ? -order : order;
      });
    }

    return found.map((record) => structuredClone(record));
  };

  const repository = {
    records,
    create: jest.fn(async (data: Partial<T>) => {
      records.push(structuredClone(data) as T);
      return structuredClone(data) as T;
    }),
    list: jest.fn(
      (filter?: RepositoryFilter<T>, options?: RepositoryQueryOptions<T>) => ({
        collect: async () => select(filter, options),
        connection: async (pagination: { first?: number } = {}) => {
          const all = select(filter, options);
          const page = all.slice(0, pagination.first ?? 20);
          return {
            totalCount: all.length,
            edges: page.map((node) => ({ cursor: node.id, node })),
            pageInfo: {
              endCursor: page.at(-1)?.id ?? null,
              hasNextPage: all.length > page.length,
            },
          };
        },
      }),
    ),
    updateOne: jest.fn(
      async (filter: RepositoryFilter<T>, data: Partial<T>) => {
        const record = records.find((candidate) => matches(candidate, filter));
        if (!record) return false;
        Object.assign(record, structuredClone(data));
        return true;
      },
    ),
    update: jest.fn(async (filter: RepositoryFilter<T>, data: Partial<T>) => {
      records
        .filter((candidate) => matches(candidate, filter))
        .forEach((record) => Object.assign(record, structuredClone(data)));
    }),
    delete: jest.fn(async (filter: RepositoryFilter<T>) => {
      for (let index = records.length - 1; index >= 0; index -= 1) {
        if (matches(records[index], filter)) records.splice(index, 1);
      }
    }),
    exists: jest.fn(async (filter: RepositoryFilter<T>) =>
      records.some((record) => matches(record, filter)),
    ),
    count: jest.fn(
      async (filter: RepositoryFilter<T>) =>
        records.filter((record) => matches(record, filter)).length,
    ),
  };

  return repository;
}
