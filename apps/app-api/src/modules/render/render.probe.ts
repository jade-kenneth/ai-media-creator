import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { resolveRenderTmpDir } from 'src/config/runtime-config';

const execFileAsync = promisify(execFile);

/**
 * Reads media facts with ffprobe. Files are written to a private temp
 * directory that is always removed, even when probing fails.
 */
@Injectable()
export class RenderProbe {
  constructor(private readonly configService: ConfigService) {}

  /** The file's duration in seconds, or null when it isn't readable media. */
  async durationSeconds(
    file: Buffer,
    extension: string,
  ): Promise<number | null> {
    const directory = await mkdtemp(
      join(resolveRenderTmpDir(this.configService), 'probe-'),
    );
    const path = join(
      directory,
      `input.${extension.replace(/[^a-z0-9]/gi, '')}`,
    );

    try {
      await writeFile(path, file);
      const { stdout } = await execFileAsync(
        this.configService.get<string>('FFPROBE_PATH') ?? 'ffprobe',
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          path,
        ],
      );
      const seconds = Number.parseFloat(stdout.trim());

      return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
    } catch {
      return null;
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
