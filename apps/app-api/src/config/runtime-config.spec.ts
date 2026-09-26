import { ConfigService } from '@nestjs/config';
import { tmpdir } from 'node:os';
import { isAbsolute, resolve } from 'node:path';
import { resolveRenderTmpDir } from './runtime-config';

describe('resolveRenderTmpDir', () => {
  const original = process.env.RENDER_TMP_DIR;

  afterEach(() => {
    if (original === undefined) delete process.env.RENDER_TMP_DIR;
    else process.env.RENDER_TMP_DIR = original;
  });

  it('uses the system temp folder when RENDER_TMP_DIR is blank in the env file', () => {
    // The schema drops the blank value, so ConfigService falls back to the
    // raw '' that the env file put in process.env.
    process.env.RENDER_TMP_DIR = '';

    expect(resolveRenderTmpDir(new ConfigService({}))).toBe(resolve(tmpdir()));
  });

  it('uses the system temp folder when RENDER_TMP_DIR is unset', () => {
    delete process.env.RENDER_TMP_DIR;

    expect(resolveRenderTmpDir(new ConfigService({}))).toBe(resolve(tmpdir()));
  });

  it('makes a configured relative folder absolute', () => {
    const directory = resolveRenderTmpDir(
      new ConfigService({ RENDER_TMP_DIR: 'tmp/render' }),
    );

    expect(isAbsolute(directory)).toBe(true);
    expect(directory).toBe(resolve('tmp/render'));
  });

  it('keeps a configured absolute folder', () => {
    expect(
      resolveRenderTmpDir(new ConfigService({ RENDER_TMP_DIR: '/var/render' })),
    ).toBe('/var/render');
  });
});
