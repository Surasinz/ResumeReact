import { act, fireEvent, render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import IntroGate, {
  BRIGHT_SECONDS,
  INTRO_SESSION_KEY,
  LOAD_SECONDS,
  ZOOM_SECONDS,
  getLoadingProgress,
  hasSeenIntro,
  markIntroSeen,
} from './IntroGate';
import { LanguageProvider } from './LanguageSystem';
import { ThemeProvider } from './ThemeSystem';

const renderGate = (onEnter = jest.fn()) => {
  const utils = render(
    <ThemeProvider>
      <LanguageProvider>
        <IntroGate onEnter={onEnter} />
      </LanguageProvider>
    </ThemeProvider>
  );
  return {
    ...utils,
    onEnter,
    gate: utils.container.querySelector('.intro-gate'),
  };
};

const advance = (seconds) =>
  act(() => {
    jest.advanceTimersByTime(seconds * 1000 + 50);
  });

beforeEach(() => {
  window.sessionStorage.clear();
  jest.useFakeTimers();
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect: jest.fn(),
    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    setTransform: jest.fn(),
    strokeRect: jest.fn(),
  });
  jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  window.sessionStorage.clear();
});

test('waits on the visitor indefinitely instead of entering on its own', () => {
  const { gate, onEnter } = renderGate();

  expect(gate).toHaveAttribute('data-phase', 'idle');

  // The room drifts for as long as it takes; nothing advances until asked.
  advance(60);
  expect(gate).toHaveAttribute('data-phase', 'idle');
  expect(onEnter).not.toHaveBeenCalled();
});

test('runs the hacker hand-off, zoom and fade in order before entering', () => {
  const { gate, onEnter } = renderGate();

  fireEvent.click(screen.getByRole('button', { name: 'Enter the portfolio' }));
  expect(gate).toHaveAttribute('data-phase', 'loading');
  expect(onEnter).not.toHaveBeenCalled();

  advance(LOAD_SECONDS);
  expect(gate).toHaveAttribute('data-phase', 'zooming');
  expect(onEnter).not.toHaveBeenCalled();

  advance(ZOOM_SECONDS);
  expect(gate).toHaveAttribute('data-phase', 'brighten');
  expect(onEnter).not.toHaveBeenCalled();

  advance(BRIGHT_SECONDS);
  expect(onEnter).toHaveBeenCalledTimes(1);
});

test('renders the layered room and animated hacker monitor without WebGL', () => {
  const { container } = renderGate();

  expect(screen.getByTestId('hacker-screen')).toBeInTheDocument();
  expect(container.querySelectorAll('.intro-layer')).toHaveLength(3);
  expect(container.querySelector('canvas')).toBeInTheDocument();
});

test('moves the layered room subtly with the pointer', () => {
  const { gate } = renderGate();
  let animationFrame;
  window.requestAnimationFrame.mockImplementation((callback) => {
    animationFrame = callback;
    return 2;
  });
  gate.getBoundingClientRect = jest.fn(() => ({
    left: 0,
    top: 0,
    width: 1000,
    height: 500,
  }));

  fireEvent(gate, new MouseEvent('pointermove', {
    bubbles: true,
    clientX: 1000,
    clientY: 500,
  }));
  act(() => animationFrame());

  expect(gate.style.getPropertyValue('--intro-x')).toBe('1.000');
  expect(gate.style.getPropertyValue('--intro-y')).toBe('1.000');
});

test('keeps loading progress monotonic within the boot phase', () => {
  expect(getLoadingProgress(0)).toBe(72);
  expect(getLoadingProgress((LOAD_SECONDS * 1000) / 2)).toBe(86);
  expect(getLoadingProgress(LOAD_SECONDS * 1000)).toBe(100);
  expect(getLoadingProgress(LOAD_SECONDS * 2000)).toBe(100);
});

test('offers a way out part-way through the sequence', () => {
  const { onEnter } = renderGate();
  const skip = screen.getByRole('button', { name: 'Skip intro' });

  fireEvent.click(screen.getByRole('button', { name: 'Enter the portfolio' }));
  advance(ZOOM_SECONDS);

  expect(skip).toBeVisible();
  expect(skip).toBeEnabled();
  fireEvent.click(skip);
  expect(onEnter).toHaveBeenCalledTimes(1);
});

test('does not hide or disable Skip with a transition-phase CSS rule', () => {
  const styles = fs.readFileSync(
    path.join(process.cwd(), 'src', 'IntroGate.css'),
    'utf8'
  );
  const phaseSkipRule = styles.match(
    /\.intro-gate:not\(\[data-phase=['"]idle['"]\]\)\s+\.intro-skip\s*\{([^}]*)\}/s
  );

  expect(phaseSkipRule?.[1] ?? '').not.toMatch(
    /(?:opacity\s*:\s*0|pointer-events\s*:\s*none)/
  );
});

test('hands over only once, however the visitor gets there', () => {
  const { onEnter } = renderGate();

  // Skipping mid-sequence must not leave the pending timer to fire a second
  // hand-off underneath the portfolio.
  fireEvent.click(screen.getByRole('button', { name: 'Enter the portfolio' }));
  advance(ZOOM_SECONDS + LOAD_SECONDS);
  fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }));
  advance(BRIGHT_SECONDS + 5);

  expect(onEnter).toHaveBeenCalledTimes(1);
});

test('skips straight through when reduced motion is requested', () => {
  window.matchMedia.mockReturnValue({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  const { onEnter, gate } = renderGate();

  fireEvent.click(screen.getByRole('button', { name: 'Enter the portfolio' }));

  // No fly-in, no boot sequence -- the destination, not the journey.
  expect(onEnter).toHaveBeenCalledTimes(1);
  expect(gate).toHaveAttribute('data-phase', 'idle');
});

test('remembers the intro for the session, and survives blocked storage', () => {
  expect(hasSeenIntro()).toBe(false);
  markIntroSeen();
  expect(window.sessionStorage.getItem(INTRO_SESSION_KEY)).toBe('true');
  expect(hasSeenIntro()).toBe(true);

  // Private-mode browsers throw on sessionStorage rather than returning null.
  const getItem = jest
    .spyOn(Storage.prototype, 'getItem')
    .mockImplementation(() => {
      throw new Error('storage disabled');
    });
  const setItem = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('storage disabled');
    });

  expect(() => markIntroSeen()).not.toThrow();
  expect(hasSeenIntro()).toBe(false);

  getItem.mockRestore();
  setItem.mockRestore();
});
