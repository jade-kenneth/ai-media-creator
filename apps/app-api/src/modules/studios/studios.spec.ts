import {
  ProjectStepKey,
  StoryGenre,
  StudioType,
} from 'src/graphql/generated/graphql';
import { ConflictError } from 'src/common/errors/app.error';
import { GENRE_MOODS, GENRE_NOTES, castLine } from './story';
import {
  assertStudio,
  STUDIO_ORDER,
  STUDIOS,
  studioFor,
  studioInfos,
  studioOf,
} from './studios';

describe('studio registry', () => {
  it('defines every studio type and lists each once in the chooser', () => {
    for (const type of Object.values(StudioType)) {
      expect(STUDIOS[type]?.type).toBe(type);
    }
    expect([...STUDIO_ORDER].sort()).toEqual(Object.values(StudioType).sort());
  });

  it('reads records from before studios existed as Affiliate', () => {
    expect(studioOf(undefined)).toBe(StudioType.AFFILIATE);
    expect(studioOf('SOMETHING_ELSE')).toBe(StudioType.AFFILIATE);
    expect(studioFor({ studioType: 'ENTERTAINMENT' }).type).toBe(
      StudioType.ENTERTAINMENT,
    );
  });

  it('keeps Affiliate Studio exactly as built', () => {
    const affiliate = STUDIOS[StudioType.AFFILIATE];

    expect(affiliate.intakeSteps).toEqual([
      ProjectStepKey.PRODUCT,
      ProjectStepKey.FACTS,
      ProjectStepKey.STRATEGY,
    ]);
    expect(affiliate.claimCheck).toBe(true);
    expect(affiliate.endCardDefault).toBe(true);
    expect(affiliate.adTag).toBe(true);
  });

  it('refuses a write on a project of another studio', () => {
    expect(() =>
      assertStudio({ studioType: 'ENTERTAINMENT' }, StudioType.AFFILIATE),
    ).toThrow(new ConflictError('This project is a story.'));
    expect(() =>
      assertStudio({ studioType: 'AFFILIATE' }, StudioType.ENTERTAINMENT),
    ).toThrow('This project is an affiliate video.');
    expect(() =>
      assertStudio({ studioType: undefined }, StudioType.AFFILIATE),
    ).not.toThrow();
  });

  it('describes the chooser cards in registry order', () => {
    expect(studioInfos().map((info) => info.title)).toEqual([
      'Affiliate video',
      'Story',
    ]);
  });

  it('has a note and a mood for every genre', () => {
    for (const genre of Object.values(StoryGenre)) {
      expect(GENRE_NOTES[genre]).toBeTruthy();
      expect(GENRE_MOODS[genre]).toBeTruthy();
    }
  });

  it('writes the cast line within the presenter limit', () => {
    expect(
      castLine([
        { name: 'Ana', role: 'a nurse', look: '20s, yellow raincoat' },
        { name: 'Ben', role: '', look: 'green rider jacket' },
      ]),
    ).toBe('Ana, a nurse, 20s, yellow raincoat; Ben, green rider jacket');
    expect(castLine([])).toBeNull();
    expect(
      castLine([{ name: 'A', role: 'x'.repeat(200), look: '' }])?.length,
    ).toBe(160);
    // A long line is cut at a word, never mid-word.
    const long = castLine([
      { name: 'Ana', role: 'word '.repeat(40), look: 'sunglasses at night' },
    ]);
    expect(long?.endsWith('word…')).toBe(true);
    expect(long!.length).toBeLessThanOrEqual(160);
  });
});
