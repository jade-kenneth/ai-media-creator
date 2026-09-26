import type { ConfigService } from '@nestjs/config';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CaptionStyle, SceneTransition } from 'src/graphql/generated/graphql';
import { buildAss, escape, time } from './render.ass';
import { clipPlaybackRate, RenderService } from './render.service';
import { verifyRenderToolchain } from './render.toolchain';
import type { RenderPlan } from './render.types';

const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';

function plan(dir: string): RenderPlan {
  return {
    scenes: [
      {
        durationMs: 2000,
        kind: 'photo',
        file: join(dir, 'photo.png'),
        slowZoom: true,
        clipStartSeconds: 0,
        onScreenText: 'Breakfast, pero portable',
        transitionIn: SceneTransition.CUT,
        sound: null,
      },
      {
        durationMs: 3000,
        kind: 'clip',
        file: join(dir, 'clip.mp4'),
        slowZoom: false,
        clipStartSeconds: 0.5,
        onScreenText: '',
        transitionIn: SceneTransition.CUT,
        sound: null,
      },
      {
        durationMs: 1500,
        kind: 'text',
        file: null,
        slowZoom: false,
        clipStartSeconds: 0,
        onScreenText: 'Link in the cart',
        transitionIn: SceneTransition.CUT,
        sound: null,
      },
    ],
    voice: [
      { file: join(dir, 'voice.mp3'), offsetMs: 0, durationMs: 1800 },
      { file: join(dir, 'voice.mp3'), offsetMs: 1800, durationMs: 1200 },
      null,
    ],
    captions: {
      enabled: true,
      style: CaptionStyle.WORD_HIGHLIGHT,
      lines: [
        {
          startMs: 0,
          endMs: 2000,
          text: 'Late ka na naman\nsa breakfast?',
          words: ['Late', 'ka', 'na', 'naman', 'sa', 'breakfast?'].map(
            (text, index) => ({
              text,
              startMs: index * 300,
              endMs: index * 300 + 280,
            }),
          ),
        },
      ],
    },
    music: { file: join(dir, 'music.mp3'), levelPercent: 20 },
    endCard: {
      durationMs: 2000,
      title: 'BlendGo Mini Portable Blender',
      cta: 'Tap the orange cart',
    },
  };
}

function transitionPlan(dir: string): RenderPlan {
  const transitions = [
    SceneTransition.CUT,
    SceneTransition.WHIP,
    SceneTransition.PUNCH_IN,
    SceneTransition.DISSOLVE,
  ];

  return {
    scenes: transitions.map((transitionIn, index) => ({
      durationMs: 1000,
      kind: 'photo',
      file: join(dir, `transition-${index}.png`),
      slowZoom: false,
      clipStartSeconds: 0,
      onScreenText: '',
      transitionIn,
      sound: null,
    })),
    voice: [
      { file: join(dir, 'voice.mp3'), offsetMs: 0, durationMs: 900 },
      { file: join(dir, 'voice.mp3'), offsetMs: 900, durationMs: 900 },
      { file: join(dir, 'voice.mp3'), offsetMs: 1800, durationMs: 900 },
      { file: join(dir, 'voice.mp3'), offsetMs: 0, durationMs: 900 },
    ],
    captions: {
      enabled: true,
      style: CaptionStyle.BOXED,
      lines: [
        {
          startMs: 2000,
          endMs: 2500,
          text: 'Third scene',
          words: [],
        },
      ],
    },
    music: null,
    endCard: {
      durationMs: 500,
      title: 'End',
      cta: null,
    },
  };
}

/**
 * Clip sound (§3.22): a 2 s clip carrying a 440 Hz tone plays its sound in a
 * 3 s scene, a clip with no audio stream asks for sound, and a photo scene
 * carries the voice; music runs under everything.
 */
function soundPlan(dir: string): RenderPlan {
  return {
    scenes: [
      {
        durationMs: 3000,
        kind: 'clip',
        file: join(dir, 'tone.mp4'),
        slowZoom: false,
        clipStartSeconds: 0,
        onScreenText: '',
        transitionIn: SceneTransition.CUT,
        sound: { levelPercent: 100 },
      },
      {
        durationMs: 2000,
        kind: 'clip',
        file: join(dir, 'clip.mp4'),
        slowZoom: false,
        clipStartSeconds: 0,
        onScreenText: '',
        transitionIn: SceneTransition.CUT,
        sound: { levelPercent: 100 },
      },
      {
        durationMs: 1000,
        kind: 'photo',
        file: join(dir, 'photo.png'),
        slowZoom: false,
        clipStartSeconds: 0,
        onScreenText: '',
        transitionIn: SceneTransition.CUT,
        sound: null,
      },
    ],
    voice: [
      null,
      null,
      { file: join(dir, 'voice.mp3'), offsetMs: 0, durationMs: 900 },
    ],
    captions: { enabled: false, style: CaptionStyle.CLEAN, lines: [] },
    music: { file: join(dir, 'music.mp3'), levelPercent: 20 },
    endCard: null,
  };
}

/**
 * A story's end card (§3.23): the project title and the end line, in the
 * product name and call to action's layout, after one text card.
 */
function storyEndCardPlan(endLine: string | null): RenderPlan {
  return {
    scenes: [
      {
        durationMs: 1000,
        kind: 'text',
        file: null,
        slowZoom: false,
        clipStartSeconds: 0,
        onScreenText: '',
        transitionIn: SceneTransition.CUT,
        sound: null,
      },
    ],
    voice: [null],
    captions: { enabled: false, style: CaptionStyle.CLEAN, lines: [] },
    music: null,
    endCard: {
      durationMs: 2000,
      title: 'The Umbrella Standoff',
      cta: endLine,
    },
  };
}

describe('buildAss', () => {
  it('writes on-screen text, text cards, highlighted words and the end card', () => {
    const ass = buildAss(plan('/tmp'));

    expect(ass).toContain('PlayResX: 1080');
    expect(ass).toContain(
      'Dialogue: 0,0:00:00.00,0:00:02.00,OnScreen,,0,0,0,,Breakfast, pero portable',
    );
    expect(ass).toContain(
      '0:00:05.00,0:00:06.50,TextCard,,0,0,0,,Link in the cart',
    );
    expect(ass).toContain(
      '{\\c&H005C7AFF}naman{\\c&H00FFFFFF}\\Nsa breakfast?',
    );
    expect(ass).toContain(
      'EndTitle,,0,0,0,,{\\an5\\pos(540,914)}BlendGo Mini Portable Blender',
    );
    expect(escape('a {b} \\c\nd')).toBe('a (b) ∖c\\Nd');
    expect(time(3_723_450)).toBe('1:02:03.45');
  });
});

describe('buildAss for a story', () => {
  it('writes the story title and end line where the product name and call to action go', () => {
    const story = buildAss(storyEndCardPlan('Part 2 tomorrow'));
    const product = buildAss(plan('/tmp'));

    expect(story).toContain(
      'Dialogue: 0,0:00:01.00,0:00:03.00,EndTitle,,0,0,0,,{\\an5\\pos(540,914)}The Umbrella Standoff',
    );
    expect(story).toContain(
      'Dialogue: 0,0:00:01.00,0:00:03.00,EndCta,,0,0,0,,{\\an5\\pos(540,1006)}Part 2 tomorrow',
    );
    // The same styles as the product end card, which is unchanged.
    expect(product).toContain(
      'EndCta,,0,0,0,,{\\an5\\pos(540,1006)}Tap the orange cart',
    );
    expect(buildAss(storyEndCardPlan(null))).not.toContain('EndCta,,');
  });
});

describe('clipPlaybackRate', () => {
  it('slows a clip only as much as its segment needs', () => {
    expect(clipPlaybackRate(8, 6)).toBe(1);
    expect(clipPlaybackRate(6, 6)).toBe(1);
    expect(clipPlaybackRate(6, 9)).toBeCloseTo(0.667, 3);
    expect(clipPlaybackRate(6, 6.25)).toBeCloseTo(0.96, 3);
    expect(clipPlaybackRate(0.5, 15)).toBe(0.0625);
    expect(clipPlaybackRate(0, 6)).toBe(1);
    expect(clipPlaybackRate(Number.NaN, 6)).toBe(1);
  });
});

let toolchain = false;
try {
  execFileSync(ffmpeg, ['-version'], { stdio: 'ignore' });
  toolchain = true;
} catch {
  toolchain = false;
}

// Renders a real fixture when FFmpeg with libass is available (the media
// worker requires it); skipped elsewhere.
const describeRender = toolchain ? describe : describe.skip;

describeRender('RenderService', () => {
  let dir = '';
  let usable = false;

  beforeAll(async () => {
    usable = await verifyRenderToolchain({
      ffmpegPath: ffmpeg,
      ffprobePath: ffprobe,
    })
      .then(() => true)
      .catch(() => false);
    dir = await mkdtemp(join(tmpdir(), 'render-spec-'));
    if (!usable) return;
    const make = (args: string[]) =>
      execFileSync(
        ffmpeg,
        ['-hide_banner', '-loglevel', 'error', '-y', ...args],
        { cwd: dir },
      );
    make([
      '-f',
      'lavfi',
      '-i',
      'testsrc=s=800x600',
      '-frames:v',
      '1',
      'photo.png',
    ]);
    make([
      '-f',
      'lavfi',
      '-i',
      'testsrc2=s=1280x720:r=25:d=2',
      '-pix_fmt',
      'yuv420p',
      'clip.mp4',
    ]);
    make([
      '-f',
      'lavfi',
      '-i',
      'testsrc2=s=1280x720:r=25:d=2',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:duration=2',
      '-pix_fmt',
      'yuv420p',
      '-shortest',
      'tone.mp4',
    ]);
    make(['-f', 'lavfi', '-i', 'sine=frequency=330:duration=3', 'voice.mp3']);
    make(['-f', 'lavfi', '-i', 'sine=frequency=660:duration=2', 'music.mp3']);
    for (const [index, color] of ['red', 'green', 'blue', 'yellow'].entries()) {
      make([
        '-f',
        'lavfi',
        '-i',
        `color=c=${color}:s=320x568`,
        '-frames:v',
        '1',
        `transition-${index}.png`,
      ]);
    }
  }, 60_000);

  afterAll(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('renders the TikTok preset with captions, voice, music and an end card', async () => {
    if (!usable) return;
    const config = {
      get: (key: string) =>
        ({ FFMPEG_PATH: ffmpeg, FFPROBE_PATH: ffprobe })[key],
    } as unknown as ConfigService;
    const service = new RenderService(config);
    const steps: string[] = [];

    const result = await service.render(plan(dir), dir, async (step) => {
      steps.push(step);
    });
    const probe = await service.probe(result.videoPath);

    expect(steps).toEqual(['media', 'audio', 'captions', 'encode']);
    expect(probe).toMatchObject({
      width: 1080,
      height: 1920,
      videoCodec: 'h264',
      audioCodec: 'aac',
    });
    expect(probe.fps).toBeCloseTo(30, 0);
    expect(Math.abs(result.durationMs - 8500)).toBeLessThan(150);
    expect((await stat(result.posterPath)).size).toBeGreaterThan(1000);
    expect(
      (await readFile(join(dir, 'overlay.ass'), 'utf8')).length,
    ).toBeGreaterThan(100);

    // Scene 2 (2–5 s) has 1.5 s of clip for 3 s: slowed, it keeps moving
    // after 3.5 s instead of holding its last frame.
    const frame = (seconds: number) =>
      execFileSync(ffmpeg, [
        '-hide_banner',
        '-loglevel',
        'error',
        '-ss',
        String(seconds),
        '-i',
        result.videoPath,
        '-vf',
        'scale=54:96',
        '-frames:v',
        '1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'gray',
        'pipe:1',
      ]);
    const [late, later] = [4, 4.8].map(frame);
    const change =
      late.reduce(
        (sum, value, index) => sum + Math.abs(value - later[index]),
        0,
      ) / late.length;

    expect(change).toBeGreaterThan(2);
  }, 180_000);

  it('plays a clip’s own sound at normal speed, holds its last frame, and keeps a silent clip silent', async () => {
    if (!usable) return;
    const config = {
      get: (key: string) =>
        ({ FFMPEG_PATH: ffmpeg, FFPROBE_PATH: ffprobe })[key],
    } as unknown as ConfigService;
    const service = new RenderService(config);
    const result = await service.render(soundPlan(dir), dir);
    // Mono 8 kHz samples of the export between two times, as their RMS.
    const rms = (from: number, to: number) => {
      const pcm = execFileSync(ffmpeg, [
        '-hide_banner',
        '-loglevel',
        'error',
        '-ss',
        String(from),
        '-t',
        String(to - from),
        '-i',
        result.videoPath,
        '-vn',
        '-ac',
        '1',
        '-ar',
        '8000',
        '-f',
        's16le',
        'pipe:1',
      ]);
      let sum = 0;
      for (let index = 0; index + 1 < pcm.length; index += 2) {
        sum += pcm.readInt16LE(index) ** 2;
      }
      return Math.sqrt(sum / Math.max(1, pcm.length / 2));
    };
    const frame = (seconds: number) =>
      execFileSync(ffmpeg, [
        '-hide_banner',
        '-loglevel',
        'error',
        '-ss',
        String(seconds),
        '-i',
        result.videoPath,
        '-vf',
        'scale=54:96',
        '-frames:v',
        '1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'gray',
        'pipe:1',
      ]);
    const [held, later] = [2.3, 2.8].map(frame);
    const change =
      held.reduce(
        (sum, value, index) => sum + Math.abs(value - later[index]),
        0,
      ) / held.length;
    const tone = rms(0.3, 1.7);
    const musicOnly = rms(3.3, 4.7);

    expect(Math.abs(result.durationMs - 6000)).toBeLessThan(150);
    // The clip's tone plays in scene 1; scene 2's clip has no sound, so only
    // the 20% music is heard there.
    expect(tone).toBeGreaterThan(musicOnly * 2.5);
    expect(musicOnly).toBeGreaterThan(20);
    // With its sound on, the 2 s clip isn't slowed to fill 3 s: it holds.
    expect(change).toBeLessThan(1);
  }, 180_000);

  it('takes a 9:16 still from inside a clip, and its last frame past the end', async () => {
    if (!usable) return;
    const config = {
      get: (key: string) =>
        ({ FFMPEG_PATH: ffmpeg, FFPROBE_PATH: ffprobe })[key],
    } as unknown as ConfigService;
    const service = new RenderService(config);

    for (const [name, seconds] of [
      ['still-inside.jpg', 1],
      ['still-past.jpg', 5],
    ] as const) {
      const output = join(dir, name);

      await service.portraitStill(join(dir, 'clip.mp4'), seconds, output);

      expect(await service.probe(output)).toMatchObject({
        width: 720,
        height: 1280,
        videoCodec: 'mjpeg',
      });
    }
  }, 60_000);

  it('stops a render that runs past its time limit', async () => {
    if (!usable) return;
    const config = {
      get: (key: string) =>
        ({ FFMPEG_PATH: ffmpeg, FFPROBE_PATH: ffprobe })[key],
    } as unknown as ConfigService;

    await expect(
      new RenderService(config).render(plan(dir), dir, undefined, 50),
    ).rejects.toMatchObject({ code: 'RENDER_TIMEOUT' });
  }, 60_000);

  it('keeps scene starts and total duration with Cut, Whip, Punch-in and Dissolve', async () => {
    if (!usable) return;
    const config = {
      get: (key: string) =>
        ({ FFMPEG_PATH: ffmpeg, FFPROBE_PATH: ffprobe })[key],
    } as unknown as ConfigService;
    const service = new RenderService(config);
    const result = await service.render(transitionPlan(dir), dir);
    const sample = (seconds: number) =>
      execFileSync(ffmpeg, [
        '-hide_banner',
        '-loglevel',
        'error',
        '-ss',
        String(seconds),
        '-i',
        result.videoPath,
        '-vf',
        'scale=1:1',
        '-frames:v',
        '1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        'pipe:1',
      ]);
    const frames = [0.5, 1.5, 2.5, 3.5].map(sample);
    const overlay = await readFile(join(dir, 'overlay.ass'), 'utf8');

    expect(Math.abs(result.durationMs - 4500)).toBeLessThan(150);
    expect(result.durationMs).toBeGreaterThanOrEqual(4400);
    expect(overlay).toContain(
      'Dialogue: 0,0:00:02.00,0:00:02.50,CaptionBoxed,,0,0,0,,Third scene',
    );
    expect(frames[0][0]).toBeGreaterThan(frames[0][1] + 80);
    expect(frames[1][1]).toBeGreaterThan(frames[1][0] + 40);
    expect(frames[2][2]).toBeGreaterThan(frames[2][0] + 80);
    expect(frames[3][0]).toBeGreaterThan(150);
    expect(frames[3][1]).toBeGreaterThan(120);
    expect(frames[3][2]).toBeLessThan(80);
  }, 180_000);

  it('burns a story’s title and end line into the end card', async () => {
    if (!usable) return;
    const config = {
      get: (key: string) =>
        ({ FFMPEG_PATH: ffmpeg, FFPROBE_PATH: ffprobe })[key],
    } as unknown as ConfigService;
    const service = new RenderService(config);
    // The brightest pixel of a full-width band of the frame at 2 s, in the
    // middle of the end card.
    const brightest = (video: string, top: number) =>
      Math.max(
        ...execFileSync(ffmpeg, [
          '-hide_banner',
          '-loglevel',
          'error',
          '-ss',
          '2',
          '-i',
          video,
          '-vf',
          `crop=1080:40:0:${top}`,
          '-frames:v',
          '1',
          '-f',
          'rawvideo',
          '-pix_fmt',
          'gray',
          'pipe:1',
        ]),
      );

    const withLine = await service.render(
      storyEndCardPlan('Part 2 tomorrow'),
      dir,
    );
    const overlay = await readFile(join(dir, 'overlay.ass'), 'utf8');
    const probe = await service.probe(withLine.videoPath);
    const [title, line] = [894, 986].map((top) =>
      brightest(withLine.videoPath, top),
    );

    expect(overlay).toContain('The Umbrella Standoff');
    expect(overlay).toContain('Part 2 tomorrow');
    expect(probe).toMatchObject({
      width: 1080,
      height: 1920,
      videoCodec: 'h264',
      audioCodec: 'aac',
    });
    expect(Math.abs(withLine.durationMs - 3000)).toBeLessThan(150);
    expect(title).toBeGreaterThan(150);
    expect(line).toBeGreaterThan(100);

    // Without an end line, only the title shows.
    const titleOnly = await service.render(storyEndCardPlan(null), dir);

    expect(brightest(titleOnly.videoPath, 894)).toBeGreaterThan(150);
    expect(brightest(titleOnly.videoPath, 986)).toBeLessThan(80);
  }, 180_000);
});
