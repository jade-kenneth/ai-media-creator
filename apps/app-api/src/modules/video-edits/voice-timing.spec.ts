import {
  applyPronunciations,
  buildSceneCaptions,
  matchAlignedWords,
  scriptWordTimings,
  spokenCaptions,
  textCaptions,
  tokenize,
  wordsFromCharacters,
  wrap,
  type TimedWord,
} from './voice-timing';

function characters(text: string, secondsPerChar = 0.05) {
  return [...text].map((character, index) => ({
    text: character,
    start: index * secondsPerChar,
    end: (index + 1) * secondsPerChar,
  }));
}

function timed(text: string, msPerWord = 400): TimedWord[] {
  return tokenize(text).map((word, index) => ({
    text: word,
    startMs: index * msPerWord,
    endMs: (index + 1) * msPerWord,
  }));
}

describe('voice timing', () => {
  it('speaks pronunciations without changing the script words', () => {
    const { spoken, source } = applyPronunciations(
      'Ang BlendGo, sobrang liit.',
      [{ word: 'blendgo', sayAs: 'Blend go' }],
    );

    expect(spoken).toBe('Ang Blend go, sobrang liit.');
    expect(source).toEqual([0, 1, 1, 2, 3]);

    const words = scriptWordTimings(
      'Ang BlendGo, sobrang liit.',
      wordsFromCharacters(characters(spoken)),
      source,
      1500,
    );

    expect(words.map((word) => word.text)).toEqual([
      'Ang',
      'BlendGo,',
      'sobrang',
      'liit.',
    ]);
    expect(words[1].startMs).toBe(200);
    expect(words[1].endMs).toBe(650);
  });

  it('groups character timing into words', () => {
    expect(wordsFromCharacters(characters('Hi there'))).toEqual([
      { text: 'Hi', startMs: 0, endMs: 100 },
      { text: 'there', startMs: 150, endMs: 400 },
    ]);
  });

  it('matches a recording that follows the script and rejects one that does not', () => {
    const tokens = tokenize('Late ka na naman sa breakfast?');
    const aligned = tokens.map((text, index) => ({
      text: text.replace('?', ''),
      start: index * 0.4,
      end: index * 0.4 + 0.35,
    }));

    expect(matchAlignedWords(tokens, aligned)?.[5]).toEqual({
      text: 'breakfast?',
      startMs: 2000,
      endMs: 2350,
    });
    expect(
      matchAlignedWords(tokens, [{ text: 'hello', start: 0, end: 1 }]),
    ).toBeNull();
  });

  it('fills a word the aligner skipped from its neighbours', () => {
    const tokens = tokenize(
      'one two three four five six seven eight nine ten eleven',
    );
    const aligned = tokens
      .map((text, index) => ({ text, start: index, end: index + 0.5 }))
      .filter((word) => word.text !== 'six');

    const words = matchAlignedWords(tokens, aligned);

    expect(words?.[5]).toEqual({ text: 'six', startMs: 4500, endMs: 6000 });
  });

  it('breaks captions at sentences and at two lines of 32 characters', () => {
    const captions = buildSceneCaptions(
      timed(
        'Late ka na naman sa breakfast? Ito ang kasya sa bag mo kahit saan ka pumunta ngayong umaga.',
      ),
      8000,
    );

    expect(captions.map((caption) => caption.text)).toEqual([
      'Late ka na naman sa breakfast?',
      'Ito ang kasya sa bag mo kahit\nsaan ka pumunta ngayong umaga.',
    ]);
    expect(captions[0].startMs).toBe(0);
    expect(captions[0].endMs).toBe(captions[1].startMs);
    expect(captions[1].endMs).toBe(8000);
    for (const caption of captions) {
      for (const line of caption.text.split('\n')) {
        expect(line.length).toBeLessThanOrEqual(32);
      }
    }
  });

  it('merges a caption shorter than 0.8 s into the next when it fits', () => {
    const captions = buildSceneCaptions(
      timed('Oo. Ito na ang sagot.', 200),
      3000,
    );

    expect(captions).toHaveLength(1);
    expect(captions[0].text).toBe('Oo. Ito na ang sagot.');
  });

  it('captions spoken lines in turn, sharing the scene by word count, never across speakers', () => {
    const long =
      'Ang ganda ng strap niya, sakto sa paa ko kahit buong araw akong naglalakad sa mall';
    const captions = spokenCaptions(['Uy, bago?', long, '  '], 9000);
    const words = tokenize(long).length;

    // 2 + 16 words over 9 s: the first line gets 1 s.
    expect(captions[0]).toMatchObject({
      startMs: 0,
      endMs: 1000,
      text: 'Uy, bago?',
    });
    expect(captions[0].words.map((word) => word.endMs)).toEqual([500, 1000]);
    expect(words).toBe(16);
    // The long line wraps into more than one caption, all within its span.
    expect(captions.length).toBeGreaterThan(2);
    expect(captions[1].startMs).toBe(1000);
    expect(captions[captions.length - 1].endMs).toBe(9000);
    expect(
      captions.slice(1).some((caption) => caption.text.includes('Uy')),
    ).toBe(false);
    expect(spokenCaptions(['', ' '], 5000)).toEqual([]);
  });

  it('shows a timed line once its reaction has played, holding it until the next line is said', () => {
    // 5 words each take 2 s; Ben's reaction holds 1.5 s before his line.
    const captions = spokenCaptions(
      ['Uy, bago ba yan ah?', 'Oo, bagong bili ko lang.'],
      8000,
      [0, 1.5],
    );

    expect(captions.map((caption) => [caption.startMs, caption.endMs])).toEqual(
      [
        [0, 3500],
        [3500, 8000],
      ],
    );
    expect(captions[0].words.at(-1)?.endMs).toBe(2000);
    expect(captions[1].words[0].startMs).toBe(3500);
    expect(captions[1].words.at(-1)?.endMs).toBe(5500);
  });

  it('uses the on-screen text as the caption without a voiceover', () => {
    expect(textCaptions('Breakfast, pero portable', 4000)).toEqual([
      { startMs: 0, endMs: 4000, text: 'Breakfast, pero portable', words: [] },
    ]);
    expect(textCaptions('  ', 4000)).toEqual([]);
    expect(wrap('a'.repeat(40))).toEqual(['a'.repeat(40)]);
  });
});
