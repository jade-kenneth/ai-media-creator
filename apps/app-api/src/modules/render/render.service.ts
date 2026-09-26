import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'node:child_process';
import { stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { SceneTransition } from 'src/graphql/generated/graphql';
import { GenerationJobError } from '../generation-jobs/generation-jobs.types';
import { buildAss } from './render.ass';
import {
  RENDER_FPS,
  RENDER_HEIGHT,
  RENDER_TIMEOUT_MS,
  RENDER_WIDTH,
  renderErrors,
  type RenderPlan,
  type RenderResult,
  type RenderScene,
} from './render.types';

/** Bundled Geist TTFs for burned-in text (OFL, see assets/fonts). */
export const RENDER_FONTS_DIR = resolve(__dirname, '../../../assets/fonts');

const COVER = `scale=${RENDER_WIDTH}:${RENDER_HEIGHT}:force_original_aspect_ratio=increase,crop=${RENDER_WIDTH}:${RENDER_HEIGHT},setsar=1`;
const STAGE = '0x0E0E12';
const ZOOM_TO = 1.08;
/** The slowest a short clip plays (the browser preview's lowest rate). */
const MIN_CLIP_RATE = 0.0625;
/** Fade at each end of a scene's clip sound, so a cut doesn't click. */
const SOUND_FADE_MS = 20;

type Progress = (
  step: 'media' | 'audio' | 'captions' | 'encode',
) => Promise<void>;

/**
 * Renders the TikTok 9:16 preset (1080 × 1920, 30 fps, H.264 + AAC) with
 * FFmpeg in a caller-owned working directory: scene segments, concatenated;
 * voice, clip sound and music mixed; text burned in with libass; a poster
 * frame; then an ffprobe check of the result. A render past its deadline is
 * killed.
 */
@Injectable()
export class RenderService {
  constructor(private readonly configService: ConfigService) {}

  async render(
    plan: RenderPlan,
    workDir: string,
    progress: Progress = async () => undefined,
    timeoutMs = RENDER_TIMEOUT_MS,
  ): Promise<RenderResult> {
    const deadline = Date.now() + timeoutMs;
    const run = (args: string[]) => this.ffmpeg(args, workDir, deadline);
    const endMs = plan.endCard?.durationMs ?? 0;
    const totalMs =
      plan.scenes.reduce((total, scene) => total + scene.durationMs, 0) + endMs;

    await progress('media');
    const segments: string[] = [];
    /** Per scene, the level its clip's own sound plays at; null when silent. */
    const sceneSound: (number | null)[] = [];
    for (const [index, scene] of plan.scenes.entries()) {
      const name = `scene-${index}.mp4`;
      const tailMs = transitionOverlapMs(plan.scenes[index + 1]?.transitionIn);
      const durationMs = scene.durationMs + tailMs;
      try {
        const facts =
          scene.kind === 'clip' && scene.file
            ? await this.probe(scene.file, deadline)
            : null;
        // A clip with its sound plays at normal speed (slowed, speech and
        // footsteps stretch and lose lip sync), holding its last frame.
        const rate =
          facts && !scene.sound
            ? clipPlaybackRate(
                facts.durationMs / 1000 - scene.clipStartSeconds,
                durationMs / 1000,
              )
            : 1;

        // A clip without an audio stream is silent rather than a failure.
        sceneSound.push(
          scene.sound && facts?.audioCodec ? scene.sound.levelPercent : null,
        );

        await run(
          sceneArgs(
            {
              ...scene,
              durationMs,
              transitionIn:
                index === 0 ? SceneTransition.CUT : scene.transitionIn,
            },
            name,
            rate,
          ),
        );
      } catch (error) {
        if (error instanceof GenerationJobError) throw error;
        throw renderErrors.unreadable();
      }
      segments.push(name);
    }
    if (plan.endCard) {
      await run(stageArgs(plan.endCard.durationMs, 'end-card.mp4'));
      segments.push('end-card.mp4');
    }
    const allCut = plan.scenes.every(
      (scene, index) =>
        index === 0 || scene.transitionIn === SceneTransition.CUT,
    );

    if (allCut) {
      await writeFile(
        join(workDir, 'segments.txt'),
        segments.map((name) => `file '${name}'`).join('\n'),
      );
      await run([
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        'segments.txt',
        '-c',
        'copy',
        'video.mp4',
      ]);
    } else {
      await run(transitionJoinArgs(plan, segments, totalMs));
    }

    await progress('audio');
    try {
      await run(audioArgs(plan, totalMs, 'audio.m4a', sceneSound));
    } catch (error) {
      if (error instanceof GenerationJobError) throw error;
      throw renderErrors.unreadable();
    }

    await progress('captions');
    await writeFile(join(workDir, 'overlay.ass'), buildAss(plan));

    await progress('encode');
    await run([
      '-i',
      'video.mp4',
      '-i',
      'audio.m4a',
      '-filter_complex',
      `[0:v]ass=overlay.ass:fontsdir=${escapeFilterPath(RENDER_FONTS_DIR)}[v]`,
      '-map',
      '[v]',
      '-map',
      '1:a',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(RENDER_FPS),
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      '-t',
      seconds(totalMs),
      'export.mp4',
    ]);
    await run([
      '-ss',
      seconds(Math.min(1000, Math.max(0, totalMs - 100))),
      '-i',
      'export.mp4',
      '-frames:v',
      '1',
      '-q:v',
      '3',
      'poster.jpg',
    ]);

    const probe = await this.probe(join(workDir, 'export.mp4'), deadline);
    const { size } = await stat(join(workDir, 'export.mp4'));

    if (
      probe.width !== RENDER_WIDTH ||
      probe.height !== RENDER_HEIGHT ||
      Math.abs(probe.fps - RENDER_FPS) > 0.1 ||
      probe.videoCodec !== 'h264' ||
      probe.audioCodec !== 'aac' ||
      Math.abs(probe.durationMs - totalMs) > 250
    ) {
      throw new Error(
        `Render check failed: ${probe.width}x${probe.height} ${probe.fps.toFixed(2)} fps ${probe.videoCodec}/${probe.audioCodec}, ${probe.durationMs} ms.`,
      );
    }

    return {
      videoPath: join(workDir, 'export.mp4'),
      posterPath: join(workDir, 'poster.jpg'),
      durationMs: probe.durationMs,
      width: probe.width,
      height: probe.height,
      sizeBytes: size,
    };
  }

  /**
   * Cover-crops a photo to a 720 × 1280 (9:16) JPEG, the first frame an AI
   * scene clip starts from. The video service keeps the image's shape.
   */
  async portraitFrame(
    input: string,
    output: string,
    deadline = Date.now() + 60_000,
  ): Promise<void> {
    await this.ffmpeg(
      [
        '-i',
        input,
        '-vf',
        'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1',
        '-frames:v',
        '1',
        '-q:v',
        '3',
        output,
      ],
      dirname(output),
      deadline,
    );
  }

  /**
   * The clip's frame at `seconds`, cover-cropped like `portraitFrame`: the
   * still of the previous scene a one-click AI clip follows (§3.21). A time
   * past the clip's end reads its last frame.
   */
  async portraitStill(
    input: string,
    seconds: number,
    output: string,
    deadline = Date.now() + 60_000,
  ): Promise<void> {
    const { durationMs } = await this.probe(input, deadline);
    // Seeking to the very end yields no frame, so stay one frame inside it.
    const at = Math.max(0, Math.min(seconds, durationMs / 1000 - 0.05));

    await this.ffmpeg(
      [
        '-ss',
        at.toFixed(3),
        '-i',
        input,
        '-vf',
        'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1',
        '-frames:v',
        '1',
        '-q:v',
        '3',
        output,
      ],
      dirname(output),
      deadline,
    );
  }

  /** Stream facts from ffprobe. */
  async probe(file: string, deadline = Date.now() + 60_000) {
    const output = await this.exec(
      this.configService.get<string>('FFPROBE_PATH') ?? 'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'stream=codec_type,codec_name,width,height,r_frame_rate:format=duration',
        '-of',
        'json',
        file,
      ],
      undefined,
      deadline,
    );
    const parsed = JSON.parse(output) as {
      streams: {
        codec_type: string;
        codec_name: string;
        width?: number;
        height?: number;
        r_frame_rate?: string;
      }[];
      format: { duration?: string };
    };
    const video = parsed.streams.find(
      (stream) => stream.codec_type === 'video',
    );
    const audio = parsed.streams.find(
      (stream) => stream.codec_type === 'audio',
    );
    const [num, den] = (video?.r_frame_rate ?? '0/1').split('/').map(Number);

    return {
      width: video?.width ?? 0,
      height: video?.height ?? 0,
      fps: den ? num / den : 0,
      videoCodec: video?.codec_name ?? null,
      audioCodec: audio?.codec_name ?? null,
      durationMs: Math.round(Number(parsed.format.duration ?? 0) * 1000),
    };
  }

  private ffmpeg(
    args: string[],
    cwd: string,
    deadline: number,
  ): Promise<string> {
    return this.exec(
      this.configService.get<string>('FFMPEG_PATH') ?? 'ffmpeg',
      ['-hide_banner', '-loglevel', 'error', '-y', ...args],
      cwd,
      deadline,
    );
  }

  private exec(
    file: string,
    args: string[],
    cwd: string | undefined,
    deadline: number,
  ): Promise<string> {
    const remaining = deadline - Date.now();

    if (remaining <= 0) return Promise.reject(renderErrors.timeout());

    return new Promise((resolvePromise, reject) => {
      execFile(
        file,
        args,
        {
          cwd,
          timeout: remaining,
          killSignal: 'SIGKILL',
          maxBuffer: 16 * 1024 * 1024,
        },
        (error, stdout, stderr) => {
          if (!error) {
            resolvePromise(stdout);
            return;
          }
          if (
            (error as { killed?: boolean }).killed ||
            Date.now() >= deadline
          ) {
            reject(renderErrors.timeout());
            return;
          }
          reject(
            new Error(
              `${file} failed: ${String(stderr).slice(-500) || error.message}`,
            ),
          );
        },
      );
    });
  }
}

/**
 * The speed a clip plays at so its footage from the start point lasts the
 * whole segment: 1 when there is enough, slower when the narration (or the
 * next scene's overlap) outlasts it. The web preview mirrors this.
 */
export function clipPlaybackRate(
  availableSeconds: number,
  neededSeconds: number,
): number {
  if (!(availableSeconds > 0) || !(neededSeconds > 0)) return 1;

  return Math.max(MIN_CLIP_RATE, Math.min(1, availableSeconds / neededSeconds));
}

function sceneArgs(scene: RenderScene, output: string, clipRate = 1): string[] {
  const duration = seconds(scene.durationMs);
  const frames = String(
    Math.max(1, Math.round((scene.durationMs / 1000) * RENDER_FPS)),
  );
  const encode = [
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(RENDER_FPS),
    '-frames:v',
    frames,
    output,
  ];

  if (scene.kind === 'text' || !scene.file)
    return stageArgs(scene.durationMs, output);

  if (scene.kind === 'clip') {
    // A short clip is slowed to fill the segment; the held last frame only
    // covers rounding (or footage too short even at the slowest rate).
    const stretch =
      clipRate < 1 ? `setpts=${(1 / clipRate).toFixed(4)}*(PTS-STARTPTS),` : '';

    return [
      '-ss',
      String(scene.clipStartSeconds),
      '-i',
      scene.file,
      '-vf',
      sceneFilter(
        `${stretch}${COVER},fps=${RENDER_FPS},tpad=stop_mode=clone:stop_duration=${duration}`,
        scene.transitionIn,
      ),
      '-t',
      duration,
      ...encode,
    ];
  }

  const zoom = scene.slowZoom
    ? // Zoom on a double-size frame so the motion stays smooth.
      `scale=${RENDER_WIDTH * 2}:${RENDER_HEIGHT * 2}:force_original_aspect_ratio=increase,crop=${RENDER_WIDTH * 2}:${RENDER_HEIGHT * 2},zoompan=z='1+${(ZOOM_TO - 1).toFixed(2)}*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${RENDER_WIDTH}x${RENDER_HEIGHT}:fps=${RENDER_FPS},setsar=1`
    : `${COVER},fps=${RENDER_FPS}`;

  return [
    '-loop',
    '1',
    '-framerate',
    String(RENDER_FPS),
    '-t',
    duration,
    '-i',
    scene.file,
    '-vf',
    sceneFilter(zoom, scene.transitionIn),
    ...encode,
  ];
}

function sceneFilter(base: string, transition: SceneTransition): string {
  if (transition !== SceneTransition.PUNCH_IN) return base;

  const scale = 'max(1,1.15-0.15*min(t/0.3,1))';
  return `${base},scale=w='trunc(iw*(${scale})/2)*2':h='trunc(ih*(${scale})/2)*2':eval=frame,crop=${RENDER_WIDTH}:${RENDER_HEIGHT}`;
}

function transitionOverlapMs(transition: SceneTransition | undefined): number {
  if (transition === SceneTransition.WHIP) return 250;
  if (transition === SceneTransition.DISSOLVE) return 400;
  return 0;
}

/** Joins every non-all-cut edit on one clock; the end card is always a cut. */
function transitionJoinArgs(
  plan: RenderPlan,
  segments: string[],
  totalMs: number,
): string[] {
  const inputs = segments.flatMap((segment) => ['-i', segment]);
  const filters = segments.map(
    (_, index) =>
      `[${index}:v]fps=${RENDER_FPS},format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS[v${index}]`,
  );
  let current = 'v0';
  let startMs = plan.scenes[0]?.durationMs ?? 0;

  for (let index = 1; index < segments.length; index += 1) {
    const isEndCard = index >= plan.scenes.length;
    const transition = isEndCard
      ? SceneTransition.CUT
      : plan.scenes[index].transitionIn;
    const next = `join${index}`;

    if (
      transition === SceneTransition.WHIP ||
      transition === SceneTransition.DISSOLVE
    ) {
      filters.push(
        `[${current}][v${index}]xfade=transition=${
          transition === SceneTransition.WHIP ? 'smoothleft' : 'fade'
        }:duration=${seconds(transitionOverlapMs(transition))}:offset=${seconds(startMs)}[${next}]`,
      );
    } else {
      filters.push(`[${current}][v${index}]concat=n=2:v=1:a=0[${next}]`);
    }

    current = next;
    if (!isEndCard) startMs += plan.scenes[index].durationMs;
  }

  return [
    ...inputs,
    '-filter_complex',
    filters.join(';'),
    '-map',
    `[${current}]`,
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(RENDER_FPS),
    '-t',
    seconds(totalMs),
    'video.mp4',
  ];
}

function stageArgs(durationMs: number, output: string): string[] {
  return [
    '-f',
    'lavfi',
    '-i',
    `color=c=${STAGE}:s=${RENDER_WIDTH}x${RENDER_HEIGHT}:r=${RENDER_FPS}`,
    '-t',
    seconds(durationMs),
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    output,
  ];
}

/**
 * Voice parts in scene order, each trimmed or padded to its scene, then the
 * end card's silence. Clips with their sound on form a second bed on the same
 * clock: each from its start point, trimmed to its scene with short fades.
 * Music loops underneath at its level and fades out. With clip sound in the
 * mix, a limiter keeps the sum from clipping.
 */
function audioArgs(
  plan: RenderPlan,
  totalMs: number,
  output: string,
  sceneSound: (number | null)[] = [],
): string[] {
  const inputs: string[] = [];
  const filters: string[] = [];
  const labels: string[] = [];
  const format =
    'aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo';
  let input = 0;

  plan.scenes.forEach((scene, index) => {
    const part = plan.voice[index];
    const label = `a${index}`;

    if (part) {
      inputs.push(
        '-ss',
        seconds(part.offsetMs),
        '-t',
        seconds(part.durationMs),
        '-i',
        part.file,
      );
      filters.push(
        `[${input}:a]${format},apad,atrim=0:${seconds(scene.durationMs)},asetpts=N/SR/TB[${label}]`,
      );
      input += 1;
    } else {
      filters.push(
        `anullsrc=r=44100:cl=stereo,atrim=0:${seconds(scene.durationMs)},asetpts=N/SR/TB[${label}]`,
      );
    }
    labels.push(`[${label}]`);
  });
  if (plan.endCard) {
    filters.push(
      `anullsrc=r=44100:cl=stereo,atrim=0:${seconds(plan.endCard.durationMs)},asetpts=N/SR/TB[aend]`,
    );
    labels.push('[aend]');
  }
  filters.push(`${labels.join('')}concat=n=${labels.length}:v=0:a=1[voice]`);

  const beds = ['[voice]'];
  const withSound = sceneSound.some((level) => level !== null);

  if (withSound) {
    const parts: string[] = [];

    plan.scenes.forEach((scene, index) => {
      const level = sceneSound[index] ?? null;
      const label = `s${index}`;
      const duration = seconds(scene.durationMs);

      if (level !== null && scene.file) {
        inputs.push('-ss', String(scene.clipStartSeconds), '-i', scene.file);
        filters.push(
          `[${input}:a]${format},atrim=0:${duration},apad,atrim=0:${duration},asetpts=N/SR/TB,afade=t=in:st=0:d=${seconds(SOUND_FADE_MS)},afade=t=out:st=${seconds(scene.durationMs - SOUND_FADE_MS)}:d=${seconds(SOUND_FADE_MS)},volume=${(level / 100).toFixed(2)}[${label}]`,
        );
        input += 1;
      } else {
        filters.push(
          `anullsrc=r=44100:cl=stereo,atrim=0:${duration},asetpts=N/SR/TB[${label}]`,
        );
      }
      parts.push(`[${label}]`);
    });
    if (plan.endCard) {
      filters.push(
        `anullsrc=r=44100:cl=stereo,atrim=0:${seconds(plan.endCard.durationMs)},asetpts=N/SR/TB[send]`,
      );
      parts.push('[send]');
    }
    filters.push(`${parts.join('')}concat=n=${parts.length}:v=0:a=1[scene]`);
    beds.push('[scene]');
  }

  if (plan.music) {
    const total = seconds(totalMs);
    const fadeStart = seconds(Math.max(0, totalMs - 1000));

    inputs.push('-stream_loop', '-1', '-i', plan.music.file);
    filters.push(
      `[${input}:a]${format},atrim=0:${total},asetpts=N/SR/TB,volume=${(plan.music.levelPercent / 100).toFixed(2)},afade=t=out:st=${fadeStart}:d=1[music]`,
    );
    beds.push('[music]');
  }

  filters.push(
    beds.length === 1
      ? '[voice]anull[mix]'
      : `${beds.join('')}amix=inputs=${beds.length}:duration=first:normalize=0${
          withSound ? ',alimiter=limit=0.95:level=false' : ''
        }[mix]`,
  );

  return [
    ...inputs,
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[mix]',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-t',
    seconds(totalMs),
    output,
  ];
}

function seconds(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(3);
}

/** Escapes a path for use inside an FFmpeg filter argument. */
function escapeFilterPath(path: string): string {
  return path.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
}
