type BatchFn<K, V> = (keys: K[]) => Promise<Map<K, V>>;

type PendingResolver<V> = {
  resolve: (value: V | null) => void;
  reject: (error: unknown) => void;
};

export interface RequestBatchLoader<K, V> {
  load(key: K): Promise<V | null>;
}

class BatchLoader<K, V> implements RequestBatchLoader<K, V> {
  private readonly cache = new Map<K, Promise<V | null>>();
  private readonly pending = new Map<K, Array<PendingResolver<V>>>();
  private scheduled = false;

  constructor(private readonly batchFn: BatchFn<K, V>) {}

  load(key: K): Promise<V | null> {
    const cached = this.cache.get(key);

    if (cached) {
      return cached;
    }

    const promise = new Promise<V | null>((resolve, reject) => {
      const resolvers = this.pending.get(key) ?? [];
      resolvers.push({ resolve, reject });
      this.pending.set(key, resolvers);
    });

    this.cache.set(key, promise);
    this.scheduleFlush();

    return promise;
  }

  private scheduleFlush(): void {
    if (this.scheduled) {
      return;
    }

    this.scheduled = true;
    process.nextTick(() => {
      void this.flush();
    });
  }

  private async flush(): Promise<void> {
    this.scheduled = false;

    const batch = new Map(this.pending);
    this.pending.clear();

    const keys = Array.from(batch.keys());

    if (keys.length === 0) {
      return;
    }

    try {
      const values = await this.batchFn(keys);

      for (const key of keys) {
        const value = values.get(key) ?? null;
        const promise = Promise.resolve(value);
        this.cache.set(key, promise);

        for (const resolver of batch.get(key) ?? []) {
          resolver.resolve(value);
        }
      }
    } catch (error) {
      for (const key of keys) {
        this.cache.delete(key);

        for (const resolver of batch.get(key) ?? []) {
          resolver.reject(error);
        }
      }
    }
  }
}

export function createBatchLoader<K, V>(
  batchFn: BatchFn<K, V>,
): RequestBatchLoader<K, V> {
  return new BatchLoader(batchFn);
}
