import { ConfigService } from '@nestjs/config';
import { GenerationFailureCode } from 'src/graphql/generated/graphql';
import { MiniMaxVideoProvider } from './minimax-video.provider';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function provider(key: string | undefined = 'minimax-key') {
  return new MiniMaxVideoProvider(
    new ConfigService({
      MINIMAX_API_KEY: key,
      MINIMAX_VIDEO_MODEL: 'MiniMax-H3-Max',
    }),
  );
}

afterEach(() => jest.restoreAllMocks());

describe('MiniMaxVideoProvider', () => {
  it('creates a first-frame task with the bearer key and returns its id', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(json({ task_id: 'task-123' }));

    const taskId = await provider().createTask({
      images: [{ url: 'https://signed.example/frame', role: 'first_frame' }],
      prompt: 'Slow push in.',
      durationSeconds: 6,
      resolution: '480P',
    });
    const [url, init] = fetchMock.mock.calls[0];

    expect(taskId).toBe('task-123');
    expect(url).toBe('https://api.minimax.io/v2/video_generation');
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer minimax-key',
    );
    expect(JSON.parse(init?.body as string)).toEqual({
      model: 'MiniMax-H3-Max',
      content: [
        { type: 'text', text: 'Slow push in.' },
        {
          type: 'image_url',
          image_url: { url: 'https://signed.example/frame' },
          role: 'first_frame',
        },
      ],
      duration: 6,
      resolution: '480P',
      ratio: 'adaptive',
    });
  });

  it('sends first and last frames adaptive, and references at 9:16', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async () => json({ task_id: 'task-1' }));
    const body = (index: number) =>
      JSON.parse(fetchMock.mock.calls[index][1]?.body as string);

    await provider().createTask({
      images: [
        { url: 'https://signed.example/0', role: 'first_frame' },
        { url: 'https://signed.example/1', role: 'last_frame' },
      ],
      prompt: 'Box to product.',
      durationSeconds: 6,
      resolution: '480P',
    });
    await provider().createTask({
      images: [0, 1, 2].map((index) => ({
        url: `https://signed.example/${index}`,
        role: 'reference_image' as const,
      })),
      prompt: 'Keep it accurate.',
      durationSeconds: 6,
      resolution: '480P',
    });

    expect(
      body(0)
        .content.slice(1)
        .map((item: { role: string }) => item.role),
    ).toEqual(['first_frame', 'last_frame']);
    expect(body(0).ratio).toBe('adaptive');
    expect(
      body(1)
        .content.slice(1)
        .map((item: { role: string }) => item.role),
    ).toEqual(['reference_image', 'reference_image', 'reference_image']);
    expect(body(1).ratio).toBe('9:16');
  });

  it('sends a text-only (Describe only) task at 9:16, since text to video can’t be adaptive', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(json({ task_id: 'task-9' }));

    await provider().createTask({
      images: [],
      prompt: 'Ana grabs the umbrella.',
      durationSeconds: 9,
      resolution: '480P',
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({
      model: 'MiniMax-H3-Max',
      content: [{ type: 'text', text: 'Ana grabs the umbrella.' }],
      duration: 9,
      resolution: '480P',
      ratio: '9:16',
    });
  });

  it('maps task states from the v2 query', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(json({ task: { status: 'running' } }))
      .mockResolvedValueOnce(
        json({
          task: {
            status: 'succeeded',
            content: { url: 'https://cdn.example/a.mp4' },
          },
        }),
      )
      .mockResolvedValueOnce(json({ task: { status: 'cancelled' } }));
    const minimax = provider();

    await expect(minimax.getTask('t')).resolves.toEqual({ status: 'pending' });
    await expect(minimax.getTask('t')).resolves.toEqual({
      status: 'succeeded',
      url: 'https://cdn.example/a.mp4',
    });
    await expect(minimax.getTask('t')).resolves.toEqual({ status: 'failed' });
  });

  it('fails as not set up without a key, and as rejected on 4xx or unreadable bodies', async () => {
    const request = {
      images: [
        { url: 'https://signed.example/frame', role: 'first_frame' as const },
      ],
      prompt: 'x',
      durationSeconds: 6,
      resolution: '480P' as const,
    };

    await expect(provider('').createTask(request)).rejects.toMatchObject({
      code: GenerationFailureCode.PROVIDER_NOT_CONFIGURED,
    });

    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(json({ error: 'bad' }, 400))
      .mockResolvedValueOnce(json({ unexpected: true }));

    await expect(provider().createTask(request)).rejects.toMatchObject({
      code: GenerationFailureCode.PROVIDER_REJECTED,
    });
    await expect(provider().createTask(request)).rejects.toMatchObject({
      code: GenerationFailureCode.PROVIDER_REJECTED,
    });
  });

  it('downloads only over https', async () => {
    await expect(
      provider().download('http://cdn.example/a.mp4', '/tmp/never'),
    ).rejects.toMatchObject({ code: GenerationFailureCode.INVALID_OUTPUT });
  });
});
