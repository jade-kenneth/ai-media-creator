import { verifyRenderToolchain, type RunTool } from './render.toolchain';

const ENCODERS = `Encoders:
 V..... = Video
 ------
 V....D libx264              libx264 H.264 / AVC / MPEG-4 AVC
 A....D aac                  AAC (Advanced Audio Coding)
`;
const FILTERS = `Filters:
  T.. = Timeline support
 .. alimiter         A->A       Audio lookahead limiter.
 .. zoompan           V->V       Apply Zoom & Pan effect.
 .. ass               V->V       Render ASS subtitles onto input video using the libass library.
 .. drawtext          V->V       Draw text on top of video frames using libfreetype library.
 .. xfade             VV->V      Cross fade one video with another video.
`;
const paths = { ffmpegPath: 'ffmpeg', ffprobePath: 'ffprobe' };

function tools(overrides: Partial<Record<string, string | Error>> = {}) {
  const outputs: Record<string, string | Error> = {
    'ffmpeg -version': 'ffmpeg version 8.0.1',
    'ffprobe -version': 'ffprobe version 8.0.1',
    'ffmpeg -encoders': ENCODERS,
    'ffmpeg -filters': FILTERS,
    ...overrides,
  };
  const run: RunTool = async (file, args) => {
    const output = outputs[`${file} ${args[args.length - 1]}`];
    if (output instanceof Error || output === undefined) {
      throw output ?? new Error('ENOENT');
    }
    return output;
  };

  return run;
}

describe('verifyRenderToolchain', () => {
  it('passes when FFmpeg has every encoder and filter', async () => {
    await expect(
      verifyRenderToolchain(paths, tools()),
    ).resolves.toBeUndefined();
  });

  it('names every missing encoder and filter in one error', async () => {
    const run = tools({
      'ffmpeg -encoders': ENCODERS.replace(/.*libx264.*\n/, ''),
      'ffmpeg -filters': FILTERS.replace(/.*zoompan.*\n/, '')
        .replace(/.*\bass\b.*\n/, '')
        .replace(/.*drawtext.*\n/, '')
        .replace(/.*xfade.*\n/, '')
        .replace(/.*alimiter.*\n/, ''),
    });

    await expect(verifyRenderToolchain(paths, run)).rejects.toThrow(
      "The media worker can't render. FFmpeg lacks encoders: libx264. FFmpeg lacks filters: alimiter, ass, drawtext, xfade, zoompan. Use a build with libass and freetype.",
    );
  });

  it('reports binaries that cannot be run', async () => {
    const run = tools({
      'ffmpeg -version': new Error('ENOENT'),
      'ffprobe -version': new Error('ENOENT'),
    });

    await expect(verifyRenderToolchain(paths, run)).rejects.toThrow(
      'FFmpeg could not be run at "ffmpeg" (FFMPEG_PATH). ffprobe could not be run at "ffprobe" (FFPROBE_PATH).',
    );
  });
});
