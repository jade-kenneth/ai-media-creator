import {
  IndexDefinition,
  IndexOptions,
  Connection as MongooseConnection,
  Schema,
  SchemaDefinition,
  Types,
  type FilterQuery,
  type HydratedDocument,
  type Model,
  type UpdateQuery,
  type UpdateWithAggregationPipeline,
} from 'mongoose';

import { SortDirection } from 'src/graphql/generated/graphql';
import {
  clampPageSize,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  RepositoryFilter,
  type CursorPaginationInput,
  type FilterCondition,
  type OffsetLimitPaginationInput,
  type OffsetResult,
  type Repository,
  type Connection as RepositoryConnection,
  type RepositoryList,
  type RepositoryQueryOptions,
  type RepositorySort,
} from './repository';

type DeserializedDocument<TSchema extends object> = TSchema & {
  _id?: unknown;
  __v?: unknown;
};

type SortEntry = [field: string, order: 1 | -1];

export function deserializeDocument<TSchema extends object>(
  document: HydratedDocument<TSchema>,
): TSchema;

export function deserializeDocument<TSchema extends object>(
  documents: Array<HydratedDocument<TSchema>>,
): Array<TSchema>;

export function deserializeDocument<TSchema extends object>(
  document: HydratedDocument<TSchema> | Array<HydratedDocument<TSchema>>,
): TSchema | Array<TSchema>;

export function deserializeDocument<TSchema extends object>(
  document: HydratedDocument<TSchema> | null,
): TSchema | null;

export function deserializeDocument<TSchema extends object>(
  document: HydratedDocument<TSchema> | Array<HydratedDocument<TSchema>> | null,
): TSchema | Array<TSchema> | null {
  if (Array.isArray(document)) {
    return document.map((item) => deserializeDocument(item));
  }

  if (!document) {
    return null;
  }

  const {
    _id: _ignoredId,
    __v: _ignoredVersion,
    ...data
  } = document.toObject() as DeserializedDocument<TSchema>;

  return data as TSchema;
}

class MongooseRepositoryList<
  TSchema extends object,
> implements RepositoryList<TSchema> {
  constructor(
    private readonly model: Model<TSchema>,
    private readonly filter: RepositoryFilter<TSchema> = {},
    private readonly options: RepositoryQueryOptions<TSchema> = {},
  ) {}

  async collect(): Promise<Array<TSchema>> {
    const documents = await this.model
      .find(serializeRepositoryFilter(this.filter))
      .sort(toMongooseSort(normalizeSort(this.options.sort)));

    return documents.map((document) => deserializeDocument(document));
  }

  async connection(
    pagination: CursorPaginationInput = {},
  ): Promise<RepositoryConnection<TSchema>> {
    const first = clampPageSize(pagination.first);
    const sort = normalizeSort(this.options.sort);
    const baseFilter = serializeRepositoryFilter(this.filter);

    const query = await withAfterCursor(
      this.model,
      baseFilter,
      sort,
      pagination.after,
    );

    const [documents, totalCount] = await Promise.all([
      this.model
        .find(query)
        .sort(toMongooseSort(sort))
        .limit(first + 1),
      this.model.countDocuments(baseFilter),
    ]);

    const hasNextPage = documents.length > first;

    const items = hasNextPage ? documents.slice(0, first) : documents;

    const edges = items.map((document) => ({
      cursor: encodeCursor(document.id),
      node: deserializeDocument(document),
    }));

    const endCursor = edges.at(-1)?.cursor ?? null;

    return {
      totalCount,
      edges,
      pageInfo: {
        endCursor,
        hasNextPage,
      },
    };
  }

  async offset(
    pagination: OffsetLimitPaginationInput = {},
  ): Promise<OffsetResult<TSchema>> {
    const page = normalizePositiveValue(pagination.page, 1);
    const limit = clampPageSize(pagination.limit);
    const offset = (page - 1) * limit;
    const query = serializeRepositoryFilter(this.filter);
    const sort = normalizeSort(this.options.sort);

    const [documents, total] = await Promise.all([
      this.model
        .find(query)
        .sort(toMongooseSort(sort))
        .skip(offset)
        .limit(limit),
      this.model.countDocuments(query),
    ]);
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    return {
      items: documents.map((document) => deserializeDocument(document)),
      pageInfo: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}

function normalizePositiveValue(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(1, Math.trunc(value));
}

function encodeCursor(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf8');
  } catch {
    throw new Error('Invalid cursor.');
  }
}

function isFilterCondition<TEntity>(
  value: unknown,
): value is FilterCondition<TEntity> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return (
    'equal' in value ||
    'notEqual' in value ||
    'in' in value ||
    'notIn' in value ||
    'greaterThan' in value ||
    'greaterThanOrEqual' in value ||
    'lesserThan' in value ||
    'lesserThanOrEqual' in value ||
    'regex' in value ||
    'options' in value ||
    'text' in value
  );
}

function serializeRepositoryFilter<TSchema extends object>(
  filter: RepositoryFilter<TSchema> = {},
): FilterQuery<TSchema> {
  const query: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(filter)) {
    if (rawValue === undefined) {
      continue;
    }

    if (!isFilterCondition(rawValue)) {
      query[key] = rawValue;
      continue;
    }

    const fieldQuery: Record<string, unknown> = {};

    if (rawValue.equal !== undefined) fieldQuery.$eq = rawValue.equal;
    if (rawValue.notEqual !== undefined) fieldQuery.$ne = rawValue.notEqual;
    if (rawValue.in !== undefined) fieldQuery.$in = rawValue.in;
    if (rawValue.notIn !== undefined) fieldQuery.$nin = rawValue.notIn;
    if (rawValue.greaterThan !== undefined)
      fieldQuery.$gt = rawValue.greaterThan;
    if (rawValue.greaterThanOrEqual !== undefined)
      fieldQuery.$gte = rawValue.greaterThanOrEqual;
    if (rawValue.lesserThan !== undefined) fieldQuery.$lt = rawValue.lesserThan;
    if (rawValue.lesserThanOrEqual !== undefined)
      fieldQuery.$lte = rawValue.lesserThanOrEqual;
    if (rawValue.regex !== undefined) fieldQuery.$regex = rawValue.regex;
    if (rawValue.options !== undefined) fieldQuery.$options = rawValue.options;

    if (
      rawValue.text !== undefined &&
      typeof rawValue.text === 'string' &&
      rawValue.text.trim()
    ) {
      query.$text = { $search: rawValue.text.trim() };
    }

    query[key] =
      Object.keys(fieldQuery).length > 0 ? fieldQuery : rawValue.equal;
  }

  return query as FilterQuery<TSchema>;
}

function normalizeSort<TSchema extends object>(
  sort?: RepositorySort<TSchema>,
): SortEntry[] {
  const normalized = Object.entries(sort ?? {}).reduce<SortEntry[]>(
    (entries, [field, direction]) => {
      if (direction !== SortDirection.ASC && direction !== SortDirection.DESC) {
        return entries;
      }

      entries.push([field, direction === SortDirection.ASC ? 1 : -1]);

      return entries;
    },
    [],
  );

  if (normalized.length === 0) {
    return [['id', 1]];
  }

  if (!normalized.some(([field]) => field === 'id')) {
    normalized.push(['id', normalized.at(-1)?.[1] ?? 1]);
  }

  return normalized;
}

function toMongooseSort(sort: SortEntry[]): Record<string, 1 | -1> {
  return Object.fromEntries(sort);
}

async function withAfterCursor<TSchema extends object>(
  model: Model<TSchema>,
  filter: FilterQuery<TSchema>,
  sort: SortEntry[],
  after?: string,
): Promise<FilterQuery<TSchema>> {
  if (!after) {
    return filter;
  }

  const cursorId = decodeCursor(after);
  const cursorDocument = await model.findOne({
    id: cursorId,
  } as FilterQuery<TSchema>);

  if (!cursorDocument) {
    throw new Error('Invalid cursor.');
  }

  const cursorFilter = buildAfterCursorRepositoryFilter(sort, cursorDocument);

  if (Object.keys(filter).length === 0) {
    return cursorFilter;
  }

  return {
    $and: [filter, cursorFilter],
  } as FilterQuery<TSchema>;
}

function buildAfterCursorRepositoryFilter<TSchema extends object>(
  sort: SortEntry[],
  cursorDocument: HydratedDocument<TSchema>,
): FilterQuery<TSchema> {
  const cursor = cursorDocument.toObject() as Record<string, unknown>;
  const clauses = sort.map(([field, order], index) => {
    const clause: Record<string, unknown> = {};

    for (const [previousField] of sort.slice(0, index)) {
      clause[previousField] = cursor[previousField];
    }

    clause[field] = {
      [order === 1 ? '$gt' : '$lt']: cursor[field],
    };

    return clause;
  });

  return {
    $or: clauses,
  } as FilterQuery<TSchema>;
}

export class MongooseRepository<TSchema extends object> implements Repository<
  TSchema,
  Types.ObjectId | RepositoryFilter<TSchema>,
  Partial<TSchema>,
  UpdateQuery<TSchema> | UpdateWithAggregationPipeline
> {
  protected readonly model: Model<TSchema>;

  constructor(
    connection: MongooseConnection,
    name: string,
    definition: SchemaDefinition,
    indexes?: [IndexDefinition, IndexOptions?][],
  ) {
    const existingModel = connection.models[name] as Model<TSchema> | undefined;

    if (existingModel) {
      this.model = existingModel;

      return;
    }

    const schema = new Schema<TSchema>(definition);

    for (const [indexDefinition, indexOptions] of indexes ?? []) {
      schema.index(indexDefinition, indexOptions);
    }

    this.model = connection.model<TSchema>(name, schema);
  }

  async create(data: Partial<TSchema>): Promise<TSchema> {
    const document = await this.model.create(data);

    return deserializeDocument(document);
  }

  list(
    filter: RepositoryFilter<TSchema> = {},
    options: RepositoryQueryOptions<TSchema> = {},
  ): RepositoryList<TSchema> {
    return new MongooseRepositoryList(this.model, filter, options);
  }

  async findMany(
    filter: RepositoryFilter<TSchema> = {},
  ): Promise<Array<TSchema>> {
    return this.list(filter).collect();
  }

  async update(
    filter: Types.ObjectId | RepositoryFilter<TSchema>,
    data: UpdateQuery<TSchema> | UpdateWithAggregationPipeline,
  ): Promise<void> {
    if (filter instanceof Types.ObjectId) {
      await this.model.updateOne(filter, data);
    } else {
      await this.model.updateMany(serializeRepositoryFilter(filter), data);
    }
  }

  async delete(
    param: Types.ObjectId | RepositoryFilter<TSchema>,
  ): Promise<void> {
    if (param instanceof Types.ObjectId) await this.model.deleteOne(param);
    else await this.model.deleteMany(serializeRepositoryFilter(param));
  }

  async exists(filter: RepositoryFilter<TSchema>): Promise<boolean> {
    return (
      (await this.model.exists(serializeRepositoryFilter(filter))) !== null
    );
  }

  async count(filter: RepositoryFilter<TSchema> = {}): Promise<number> {
    return this.model.countDocuments(serializeRepositoryFilter(filter));
  }

  async find(
    param?: Types.ObjectId | RepositoryFilter<TSchema>,
  ): Promise<TSchema> {
    if (param instanceof Types.ObjectId) {
      const document = await this.model.findById(param);
      if (!document) {
        throw new Error('Document not found.');
      }

      return deserializeDocument(document) as TSchema;
    }
    const document = await this.model.findOne(serializeRepositoryFilter(param));

    if (!document) {
      throw new Error('Document not found.');
    }

    return deserializeDocument(document) as TSchema;
  }

  async search(
    search: string,
    filter: RepositoryFilter<TSchema> = {},
    opts: {
      index: string;
      path: string | string[];
      type?: 'autocomplete' | 'text';
      limit?: number;
      secondaryPreferred?: true;
    },
  ): Promise<Array<TSchema>> {
    const sortPath = Array.isArray(opts.path) ? opts.path[0] : opts.path;
    const operator =
      opts.type === 'text'
        ? {
            text: {
              path: opts.path,
              query: search,
            },
          }
        : {
            autocomplete: {
              path: opts.path,
              query: search,
              tokenOrder: 'sequential',
            },
          };
    const documents: Array<TSchema> = await this.model.aggregate([
      {
        $search: {
          index: opts.index,
          ...operator,
          sort: {
            score: { $meta: 'searchScore', order: -1 },
          },
        },
      },
      { $match: filter ? serializeRepositoryFilter(filter) : {} },
      {
        $limit: MAX_PAGE_SIZE,
      },
      {
        $sort: {
          [sortPath]: 1,
        },
      },
      { $limit: clampPageSize(opts.limit, DEFAULT_PAGE_SIZE) },
    ]);

    return documents;
  }
}
