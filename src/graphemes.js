const fallbackCombiningMark =
  /[\u0300-\u036f\u0e31\u0e33-\u0e3a\u0e47-\u0e4e\ufe00-\ufe0f]/;

export function splitGraphemes(value, locale = 'en') {
  if (!value) return [];

  if (typeof Intl?.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(locale, {
      granularity: 'grapheme',
    });
    return Array.from(segmenter.segment(value), ({ segment }) => segment);
  }

  return Array.from(value).reduce((segments, character) => {
    const previous = segments[segments.length - 1];
    if (
      previous &&
      (fallbackCombiningMark.test(character) ||
        character === '\u200d' ||
        previous.endsWith('\u200d'))
    ) {
      segments[segments.length - 1] += character;
    } else {
      segments.push(character);
    }
    return segments;
  }, []);
}
