import type { ConfigService } from '@nestjs/config';
import { GenerationFailureCode } from 'src/graphql/generated/graphql';
import { ElevenLabsVoiceProvider } from './providers/elevenlabs-voice.provider';
import { VoiceService } from './voice.service';

function config(values: Record<string, unknown>) {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const configured = config({
  ELEVENLABS_API_KEY: 'test-key',
  ELEVENLABS_MODEL_ID: 'eleven_multilingual_v2',
  ELEVENLABS_VOICE_IDS: ['voice-ava', 'voice-leo'],
});

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('VoiceService with ElevenLabs', () => {
  afterEach(() => jest.restoreAllMocks());

  it('lists allowlisted voices with samples and caches a complete list', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) =>
        respond({
          voice_id: String(url).split('/').pop(),
          name: String(url).endsWith('ava') ? 'Ava' : 'Leo',
          preview_url: 'https://cdn.example/sample.mp3',
          labels: { description: 'warm', accent: 'filipino' },
        }),
      );
    const service = new VoiceService(
      configured,
      new ElevenLabsVoiceProvider(configured),
    );

    const voices = await service.listVoices(0);
    await service.listVoices(1000);

    expect(voices).toEqual([
      {
        id: 'voice-ava',
        name: 'Ava',
        descriptor: 'Warm · Filipino',
        sampleUrl: 'https://cdn.example/sample.mp3',
      },
      expect.objectContaining({ id: 'voice-leo', name: 'Leo' }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'GET',
      headers: { 'xi-api-key': 'test-key' },
    });
  });

  it('sends text, model, speed and context, and decodes audio and timing', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      respond({
        audio_base64: Buffer.from('mp3').toString('base64'),
        alignment: {
          characters: ['H', 'i'],
          character_start_times_seconds: [0, 0.1],
          character_end_times_seconds: [0.1, 0.2],
        },
      }),
    );
    const service = new VoiceService(
      configured,
      new ElevenLabsVoiceProvider(configured),
    );

    const speech = await service.speak({
      voiceId: 'voice-ava',
      text: 'Hi',
      speed: 1.1,
      nextText: 'there',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      'https://api.elevenlabs.io/v1/text-to-speech/voice-ava/with-timestamps?output_format=mp3_44100_128',
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      text: 'Hi',
      model_id: 'eleven_multilingual_v2',
      voice_settings: { speed: 1.1 },
      next_text: 'there',
    });
    expect(speech.audio.toString()).toBe('mp3');
    expect(speech.characters[1]).toEqual({ text: 'i', start: 0.1, end: 0.2 });
  });

  it('maps not set up, refusals, unreadable replies and timeouts to job failures', async () => {
    const unconfigured = config({ ELEVENLABS_VOICE_IDS: [] });
    const bare = new VoiceService(
      unconfigured,
      new ElevenLabsVoiceProvider(unconfigured),
    );

    await expect(bare.listVoices()).resolves.toEqual([]);
    await expect(
      bare.speak({ voiceId: 'voice-ava', text: 'Hi', speed: 1 }),
    ).rejects.toMatchObject({
      code: GenerationFailureCode.PROVIDER_NOT_CONFIGURED,
    });

    const service = new VoiceService(
      configured,
      new ElevenLabsVoiceProvider(configured),
    );
    const speak = () =>
      service.speak({ voiceId: 'voice-ava', text: 'Hi', speed: 1 });

    await expect(
      service.speak({ voiceId: 'voice-other', text: 'Hi', speed: 1 }),
    ).rejects.toMatchObject({ code: GenerationFailureCode.PROVIDER_REJECTED });

    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(respond({ detail: 'no' }, 422));
    await expect(speak()).rejects.toMatchObject({
      code: GenerationFailureCode.PROVIDER_REJECTED,
    });

    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(respond({ unexpected: true }));
    await expect(speak()).rejects.toMatchObject({
      code: GenerationFailureCode.PROVIDER_REJECTED,
    });

    jest
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(
        Object.assign(new Error('timed out'), { name: 'TimeoutError' }),
      );
    await expect(speak()).rejects.toMatchObject({
      code: GenerationFailureCode.PROVIDER_TIMEOUT,
    });
  });

  it('posts a recording and transcript for forced alignment', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      respond({
        characters: [],
        words: [{ text: 'Hi', start: 0, end: 0.3, loss: 0.1 }],
        loss: 0.1,
      }),
    );
    const service = new VoiceService(
      configured,
      new ElevenLabsVoiceProvider(configured),
    );

    const result = await service.align(
      Buffer.from('audio'),
      'narration.m4a',
      'Hi',
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.elevenlabs.io/v1/forced-alignment');
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get('text')).toBe('Hi');
    // Per-word loss isn't used; the overall loss is kept for calibration.
    expect(result).toEqual({
      words: [{ text: 'Hi', start: 0, end: 0.3 }],
      loss: 0.1,
    });
  });
});
