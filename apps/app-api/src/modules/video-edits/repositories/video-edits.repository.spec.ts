import { createConnection, type Model } from 'mongoose';
import { VideoEditsRepositoryFactory } from './video-edits.repository';

/**
 * The service specs run on an in-memory repository, so they can't see what
 * Mongoose drops: a scene field missing from the schema is stripped on write
 * (strict mode). These checks run the real schema, with no database.
 */
describe('VideoEdits schema', () => {
  const connection = createConnection();
  let model: Model<{ id: string; scenes: Record<string, unknown>[] }>;

  beforeAll(async () => {
    await VideoEditsRepositoryFactory(connection);
    model = connection.models.VideoEdits;
  });

  afterAll(() => connection.close());

  const scene = {
    sceneId: 's1',
    order: 1,
    purpose: 'HOOK',
    narration: '',
    visual: 'Ana walks up in new sandals',
    onScreenText: '',
    cta: null,
    durationSeconds: 6,
    media: null,
  };

  it("keeps a skit scene's lines with their beats, its sound and its clip sound", () => {
    const lines = [
      {
        speaker: 'Ben',
        text: "Uy, bago 'yan ah?",
        shot: 'close-up on Ben',
        reaction: 'stops, looks down at the sandals',
        pauseSeconds: 1,
        delivery: 'half laughing',
      },
    ];
    const stored = new model({
      id: 'e1',
      scenes: [
        {
          ...scene,
          lines,
          sound: 'sandals slapping on the pavement',
          clipSound: { on: true, levelPercent: 80 },
        },
      ],
    }).toObject();

    expect(stored.scenes[0]).toMatchObject({
      lines,
      sound: 'sandals slapping on the pavement',
      clipSound: { on: true, levelPercent: 80 },
    });
  });

  it('leaves a narrated scene without skit fields', () => {
    const stored = new model({ id: 'e2', scenes: [scene] }).toObject();

    expect(stored.scenes[0]).not.toHaveProperty('lines');
    expect(stored.scenes[0]).not.toHaveProperty('sound');
    expect(stored.scenes[0]).not.toHaveProperty('clipSound');
  });
});
