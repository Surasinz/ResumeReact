import { act, render, screen } from '@testing-library/react';
import NotFoundPage, { ERROR_LOG } from './NotFoundPage';

beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({ matches: false }),
  });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('types the full error log, reveals the bot warning, and links home', () => {
  render(<NotFoundPage />);

  expect(screen.getByLabelText('Error 404')).toHaveTextContent('404');
  expect(screen.getByRole('status')).toBeEmptyDOMElement();

  act(() => {
    jest.runAllTimers();
  });

  expect(
    document.querySelector('.error-terminal-output > span').textContent
  ).toBe(ERROR_LOG);
  expect(screen.getByRole('status')).toHaveTextContent(
    'WARNING: Page payload not found!'
  );
  expect(
    screen.getByRole('link', { name: /INITIALIZE REBOOT/i })
  ).toHaveAttribute('href', '/');
});

test('cancels the typewriter timer when the page unmounts', () => {
  const { unmount } = render(<NotFoundPage />);

  expect(jest.getTimerCount()).toBeGreaterThan(0);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

test('shows the complete recovery state immediately with reduced motion', () => {
  window.matchMedia.mockReturnValue({ matches: true });
  render(<NotFoundPage />);

  expect(
    document.querySelector('.error-terminal-output > span').textContent
  ).toBe(ERROR_LOG);
  expect(screen.getByRole('status')).toHaveTextContent(
    'WARNING: Page payload not found!'
  );
  expect(jest.getTimerCount()).toBe(0);
});
