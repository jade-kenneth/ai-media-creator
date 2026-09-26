import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

/** Runs a command-line tool and resolves with its standard output. */
export type RunTool = (file: string, args: string[]) => Promise<string>;

const execFileAsync = promisify(execFile);

const runTool: RunTool = async (file, args) => {
  const { stdout } = await execFileAsync(file, args, {
    maxBuffer: 8 * 1024 * 1024,
  });

  return stdout;
};

/** H.264 video and AAC audio for the TikTok 9:16 MP4 preset. */
export const REQUIRED_ENCODERS = ['libx264', 'aac'] as const;
/** Burned-in captions/text via libass + drawtext (with freetype), photo zoom, transitions, and the limiter on clip sound. */
export const REQUIRED_FILTERS = [
  'alimiter',
  'ass',
  'drawtext',
  'xfade',
  'zoompan',
] as const;

export interface RenderToolchainPaths {
  ffmpegPath: string;
  ffprobePath: string;
}

/**
 * Confirms FFmpeg and ffprobe can be run and that FFmpeg was built with every
 * encoder and filter the render pipeline uses. Throws one error naming
 * everything that is missing, so a misbuilt image fails at start instead of
 * on the first paid render.
 */
export async function verifyRenderToolchain(
  { ffmpegPath, ffprobePath }: RenderToolchainPaths,
  run: RunTool = runTool,
): Promise<void> {
  const problems: string[] = [];

  const ffmpeg = await run(ffmpegPath, ['-hide_banner', '-version']).catch(
    () => null,
  );

  if (ffmpeg === null) {
    problems.push(`FFmpeg could not be run at "${ffmpegPath}" (FFMPEG_PATH).`);
  }

  const ffprobe = await run(ffprobePath, ['-hide_banner', '-version']).catch(
    () => null,
  );

  if (ffprobe === null) {
    problems.push(
      `ffprobe could not be run at "${ffprobePath}" (FFPROBE_PATH).`,
    );
  }

  if (ffmpeg !== null) {
    const [encoders, filters] = await Promise.all([
      run(ffmpegPath, ['-hide_banner', '-encoders']),
      run(ffmpegPath, ['-hide_banner', '-filters']),
    ]);
    const missingEncoders = missing(REQUIRED_ENCODERS, listedNames(encoders));
    const missingFilters = missing(REQUIRED_FILTERS, listedNames(filters));

    if (missingEncoders.length) {
      problems.push(`FFmpeg lacks encoders: ${missingEncoders.join(', ')}.`);
    }

    if (missingFilters.length) {
      problems.push(
        `FFmpeg lacks filters: ${missingFilters.join(', ')}. Use a build with libass and freetype.`,
      );
    }
  }

  if (problems.length) {
    throw new Error(`The media worker can't render. ${problems.join(' ')}`);
  }
}

/**
 * Checks the toolchain during module init. Nest runs every onModuleInit
 * before onApplicationBootstrap, where job intervals start, so a worker with
 * a broken toolchain exits before it can claim a job.
 */
@Injectable()
export class RenderToolchainCheck implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await verifyRenderToolchain({
      ffmpegPath: this.configService.get<string>('FFMPEG_PATH') ?? 'ffmpeg',
      ffprobePath: this.configService.get<string>('FFPROBE_PATH') ?? 'ffprobe',
    });
  }
}

/** Names from `ffmpeg -encoders` / `-filters` rows: flags, then the name. */
function listedNames(output: string): Set<string> {
  const names = new Set<string>();

  for (const line of output.split('\n')) {
    const [flags, name] = line.trim().split(/\s+/);

    if (flags && name && /^[A-Z.|]+$/.test(flags)) names.add(name);
  }

  return names;
}

function missing(required: readonly string[], present: Set<string>): string[] {
  return required.filter((name) => !present.has(name));
}
