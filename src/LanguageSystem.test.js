import { fireEvent, render, screen } from '@testing-library/react';
import {
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  LanguageToggle,
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
