import { fireEvent, render, screen } from '@testing-library/react';
import {
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  LanguageToggle,
  LocalizedText,
  translations,
  useLanguage,
} from './LanguageSystem';

function TranslationProbe() {
  const { language, t } = useLanguage();
  return (
    <p data-testid="translation" data-language={language}>
      {t('hero_subtitle')}
    </p>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = 'en';
  delete document.body.dataset.language;
});

test('defaults to English and switches to persisted Thai', () => {
  render(
    <LanguageProvider>
      <LanguageToggle />
      <TranslationProbe />
    </LanguageProvider>
  );

  expect(document.documentElement).toHaveAttribute('lang', 'en');
  expect(screen.getByTestId('translation')).toHaveTextContent(
    'Software Engineer specializing in enterprise applications'
  );

  fireEvent.click(screen.getByRole('button', { name: 'Use Thai' }));

  expect(document.documentElement).toHaveAttribute('lang', 'th');
  expect(document.body).toHaveAttribute('data-language', 'th');
  expect(screen.getByTestId('translation')).toHaveTextContent(
    'Software Engineer ที่เชี่ยวชาญด้าน Enterprise Applications'
  );
  expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('th');
});

test('restores a saved Thai preference', () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'th');

  render(
    <LanguageProvider>
      <LanguageToggle />
      <TranslationProbe />
    </LanguageProvider>
  );

  expect(screen.getByRole('button', { name: 'Use Thai' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByTestId('translation')).toHaveAttribute(
    'data-language',
    'th'
  );
});

test('keeps the expanded English and Thai dictionaries in sync', () => {
  const englishKeys = Object.keys(translations.en).sort();
  const thaiKeys = Object.keys(translations.th).sort();

  expect(englishKeys.length).toBeGreaterThan(100);
  expect(thaiKeys).toEqual(englishKeys);
});

test('marks preserved technical terms as English inside Thai copy', () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'th');

  render(
    <LanguageProvider>
      <LocalizedText as="p" i18nKey="about_p1" />
    </LanguageProvider>
  );

  expect(screen.getByText('Software Engineer')).toHaveAttribute('lang', 'en');
  expect(screen.getByText('Oracle APEX')).toHaveAttribute('lang', 'en');
  expect(screen.getByText('JavaScript')).toHaveAttribute('lang', 'en');
});

test('does not split short technical terms out of longer English words', () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'th');

  const { container } = render(
    <LanguageProvider>
      <LocalizedText as="p">Building UI</LocalizedText>
    </LanguageProvider>
  );

  expect(container.querySelector('p')).toHaveTextContent('Building UI');
  expect(container.querySelectorAll('p > span[lang="en"]')).toHaveLength(1);
  expect(container.querySelector('p > span[lang="en"]')).toHaveTextContent('UI');
});
