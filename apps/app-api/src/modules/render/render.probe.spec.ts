import type { ConfigService } from '@nestjs/config';
import { execFileSync } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RenderProbe } from './render.probe';

function available(binary: string): boolean {
  try {
    execFileSync(binary, ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Runs against the real binaries when they are installed (the media worker
// requires them); skipped on machines without FFmpeg.
const describeWithFfmpeg =
  available('ffmpeg') && available('ffprobe') ? describe : describe.skip;

describeWithFfmpeg('RenderProbe', () => {
  const probe = new RenderProbe({
    get: () => undefined,
  } as unknown as ConfigService);

  it('reads the duration of real audio', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'probe-spec-'));
    const path = join(directory, 'tone.mp3');

    try {
      execFileSync('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'lavfi',
        '-i',
        'sine=frequency=440:duration=2.5',
        '-y',
        path,
      ]);
      const seconds = await probe.durationSeconds(await readFile(path), 'mp3');

      expect(seconds).toBeGreaterThan(2.4);
      expect(seconds).toBeLessThan(2.7);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('returns null for a file that is not media', async () => {
    await expect(
      probe.durationSeconds(Buffer.from('not audio'), 'm4a'),
    ).resolves.toBeNull();
  });
});
