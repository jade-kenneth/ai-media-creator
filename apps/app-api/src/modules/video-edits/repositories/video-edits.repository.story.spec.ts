import { createConnection, type Model } from 'mongoose';
import { VideoEditsRepositoryFactory } from './video-edits.repository';

/**
 * A story's video (§3.23) stores an end line and character items with their
 * likeness confirmation; Mongoose strict mode drops undeclared fields, so
 * these run the real schema, with no database.
 */
describe('VideoEdits schema for stories', () => {
  const connection = createConnection();
  let model: Model<Record<string, unknown>>;

  beforeAll(async () => {
    await VideoEditsRepositoryFactory(connection);
    model = connection.models.VideoEdits;
  });

  afterAll(() => connection.close());

  it('keeps the end line and a character’s likeness confirmation', () => {
    const confirmedAt = new Date('2026-09-26T01:00:00Z');
    const stored = new model({
      id: 'e1',
      endLine: 'Part 2 tomorrow',
      consistentItems: [
        {
          itemId: 'character-ana-00001',
          kind: 'CHARACTER',
          name: 'Ana',
          sceneIds: ['s1'],
          assetId: 'p1',
          origin: 'STORY',
          likenessConfirmedAt: confirmedAt,
        },
      ],
    }).toObject();

    expect(stored.endLine).toBe('Part 2 tomorrow');
    expect(stored.consistentItems).toEqual([
      expect.objectContaining({
        kind: 'CHARACTER',
        origin: 'STORY',
        likenessConfirmedAt: confirmedAt,
      }),
    ]);
  });

  it('reads no end line on a video stored without one', () => {
    const stored = new model({ id: 'e2' }).toObject();

    expect(stored.endLine).toBeNull();
  });
});
