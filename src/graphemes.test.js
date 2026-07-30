import { splitGraphemes } from './graphemes';

test('keeps Thai base characters and combining marks in one animation frame', () => {
  const segments = splitGraphemes('กำลัง', 'th');

  expect(segments.join('')).toBe('กำลัง');
  expect(segments).toContain('ลั');
  expect(segments).not.toContain('ั');
});

test('uses a combining-mark-safe fallback when Intl.Segmenter is unavailable', () => {
  const originalSegmenter = Intl.Segmenter;
  Object.defineProperty(Intl, 'Segmenter', {
    configurable: true,
    value: undefined,
  });

  expect(splitGraphemes('กำลัง', 'th')).toEqual(['กำ', 'ลั', 'ง']);

  Object.defineProperty(Intl, 'Segmenter', {
    configurable: true,
    value: originalSegmenter,
  });
});
