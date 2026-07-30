import { fireEvent, render, screen } from '@testing-library/react';
import {
  THEME_STORAGE_KEY,
  ThemeProvider,
  ThemeToggle,
  useTheme,
} from './ThemeSystem';

function ThemeProbe() {
  const { theme } = useTheme();
  return <output data-testid="theme-value">{theme}</output>;
}

beforeEach(() => {
  window.localStorage.clear();
  delete document.body.dataset.theme;
});

test('uses light mode by default and persists theme changes', () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
      <ThemeProbe />
    </ThemeProvider>
  );

  const toggle = screen.getByRole('switch');
  expect(document.body).toHaveAttribute('data-theme', 'light');
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

  fireEvent.click(toggle);

  expect(document.body).toHaveAttribute('data-theme', 'dark');
  expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
});

test('restores a saved dark theme', () => {
  window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

  render(
    <ThemeProvider>
      <ThemeToggle />
      <ThemeProbe />
    </ThemeProvider>
  );

  expect(document.body).toHaveAttribute('data-theme', 'dark');
  expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
});
