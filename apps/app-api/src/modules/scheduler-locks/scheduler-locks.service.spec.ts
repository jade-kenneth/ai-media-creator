import { SchedulerLocksService } from './scheduler-locks.service';
import type { SchedulerLocksRepository } from './repositories/scheduler-locks.repository';

describe('SchedulerLocksService', () => {
  const now = new Date('2026-06-22T01:00:00.000Z');
  let locks: jest.Mocked<Pick<SchedulerLocksRepository, 'create' | 'delete'>>;
  let service: SchedulerLocksService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    locks = {
      create: jest.fn().mockResolvedValue({
        id: 'lock-id',
        name: 'test-lock',
        owner: 'owner',
        acquiredAt: now,
        expiresAt: new Date(now.getTime() + 1000),
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    service = new SchedulerLocksService(
      locks as unknown as SchedulerLocksRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('acquires a lock when create succeeds', async () => {
    await expect(service.acquire('test-lock', 1000)).resolves.toBe(true);

    expect(locks.delete).toHaveBeenCalledWith({
      name: 'test-lock',
      expiresAt: { lesserThan: now },
    });
    expect(locks.create).toHaveBeenCalledWith({
      id: expect.any(String),
      name: 'test-lock',
      owner: expect.any(String),
      acquiredAt: now,
      expiresAt: new Date(now.getTime() + 1000),
    });
  });

  it('returns false when another holder already owns the lock', async () => {
    locks.create.mockRejectedValueOnce({ code: 11000 });

    await expect(service.acquire('test-lock', 1000)).resolves.toBe(false);
  });

  it('rethrows non-duplicate create errors', async () => {
    const error = new Error('database unavailable');
    locks.create.mockRejectedValueOnce(error);

    await expect(service.acquire('test-lock', 1000)).rejects.toBe(error);
  });

  it('releases only locks owned by this instance', async () => {
    await service.release('test-lock');

    expect(locks.delete).toHaveBeenCalledWith({
      name: 'test-lock',
      owner: expect.any(String),
    });
  });

  it('runs the task and releases when the lock is acquired', async () => {
    const task = jest.fn().mockResolvedValue(undefined);

    await expect(service.withLock('test-lock', 1000, task)).resolves.toBe(true);

    expect(task).toHaveBeenCalledTimes(1);
    expect(locks.delete).toHaveBeenLastCalledWith({
      name: 'test-lock',
      owner: expect.any(String),
    });
  });

  it('releases when the task throws', async () => {
    const error = new Error('task failed');
    const task = jest.fn().mockRejectedValue(error);

    await expect(service.withLock('test-lock', 1000, task)).rejects.toBe(error);

    expect(locks.delete).toHaveBeenLastCalledWith({
      name: 'test-lock',
      owner: expect.any(String),
    });
  });

  it('does not run or release when the lock is not acquired', async () => {
    locks.create.mockRejectedValueOnce({ code: 11000 });
    const task = jest.fn().mockResolvedValue(undefined);

    await expect(service.withLock('test-lock', 1000, task)).resolves.toBe(
      false,
    );

    expect(task).not.toHaveBeenCalled();
    expect(locks.delete).toHaveBeenCalledTimes(1);
    expect(locks.delete).toHaveBeenCalledWith({
      name: 'test-lock',
      expiresAt: { lesserThan: now },
    });
  });
});
