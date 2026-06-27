import { createBatchLoader } from './request-batch-loader';

describe('createBatchLoader', () => {
  it('coalesces loads from the same tick into one batch', async () => {
    const batchFn = jest.fn(async (keys: string[]) => {
      return new Map(keys.map((key) => [key, key.toUpperCase()]));
    });
    const loader = createBatchLoader(batchFn);

    await expect(
      Promise.all([loader.load('a'), loader.load('b')]),
    ).resolves.toEqual(['A', 'B']);

    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith(['a', 'b']);
  });

  it('dedupes duplicate keys and serves later repeats from cache', async () => {
    const batchFn = jest.fn(async (keys: string[]) => {
      return new Map(keys.map((key) => [key, key.toUpperCase()]));
    });
    const loader = createBatchLoader(batchFn);

    const first = loader.load('a');
    const second = loader.load('a');

    await expect(Promise.all([first, second])).resolves.toEqual(['A', 'A']);
    await expect(loader.load('a')).resolves.toBe('A');

    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith(['a']);
  });

  it('resolves missing keys as null', async () => {
    const loader = createBatchLoader<string, string>(async () => new Map());

    await expect(loader.load('missing')).resolves.toBeNull();
  });

  it('rejects in-flight loads when the batch fails', async () => {
    const error = new Error('batch failed');
    const loader = createBatchLoader<string, string>(async () => {
      throw error;
    });

    await expect(
      Promise.all([loader.load('a'), loader.load('b')]),
    ).rejects.toThrow('batch failed');
  });

  it('runs separate batches for loads from separate ticks', async () => {
    const batchFn = jest.fn(async (keys: string[]) => {
      return new Map(keys.map((key) => [key, key.toUpperCase()]));
    });
    const loader = createBatchLoader(batchFn);

    await expect(loader.load('a')).resolves.toBe('A');
    await expect(loader.load('b')).resolves.toBe('B');

    expect(batchFn).toHaveBeenCalledTimes(2);
    expect(batchFn).toHaveBeenNthCalledWith(1, ['a']);
    expect(batchFn).toHaveBeenNthCalledWith(2, ['b']);
  });
});
