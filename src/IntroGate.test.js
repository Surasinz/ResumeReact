import { act, fireEvent, render, screen } from '@testing-library/react';
import IntroGate, {
  BRIGHT_SECONDS,
  INTRO_SESSION_KEY,
  LOAD_SECONDS,
  ZOOM_SECONDS,
  getLandscapeBlend,
  getScreenCameraDistance,
  hasSeenIntro,
  markIntroSeen,
} from './IntroGate';
import { LanguageProvider } from './LanguageSystem';
import { ThemeProvider } from './ThemeSystem';

// Stands in for the whole 3D subtree. Rendering the children would hand r3f
// primitives like <ambientLight> to the DOM renderer, which only produces
// casing warnings -- the scene is not what these tests are about.
jest.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="intro-canvas" />,
  useFrame: () => {},
  useThree: () => ({ camera: {}, viewport: { width: 8, height: 5 } }),
}));

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

/*
  useFrame is mocked to never fire, so this also stands as the proof that the
  sequence runs on timers rather than the render loop: if any step waited on
  the 3D loop it would stall here instead of reaching the hand-off.
*/
test('runs zoom, load and brighten in order before handing over', () => {
  const { gate, onEnter } = renderGate();
  const skip = screen.getByRole('button', { name: 'Skip intro' });

  const enter = screen.getByRole('button', { name: 'Enter the portfolio' });
  fireEvent.click(enter);
  expect(gate).toHaveAttribute('data-phase', 'zooming');
  expect(skip).toHaveFocus();
  expect(enter).toBeDisabled();
  expect(enter).toHaveAttribute('tabindex', '-1');
  expect(enter.closest('.intro-menu')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Moving into the secure monitor'
  );
  expect(onEnter).not.toHaveBeenCalled();

  advance(ZOOM_SECONDS);
  expect(gate).toHaveAttribute('data-phase', 'loading');
  expect(screen.getByRole('status')).toHaveTextContent('Loading portfolio');
  expect(onEnter).not.toHaveBeenCalled();

  advance(LOAD_SECONDS);
  expect(gate).toHaveAttribute('data-phase', 'brighten');
  expect(onEnter).not.toHaveBeenCalled();

  // Only once the room has blown out does the portfolio take over.
  advance(BRIGHT_SECONDS);
  expect(onEnter).toHaveBeenCalledTimes(1);
});

test('blends portrait and landscape camera framing without a breakpoint jump', () => {
  expect(getLandscapeBlend(0.62)).toBe(0);
  expect(getLandscapeBlend(1.1)).toBe(1);

  const justBelow = getScreenCameraDistance(1.7, 1, 0.779);
  const justAbove = getScreenCameraDistance(1.7, 1, 0.781);
  expect(Math.abs(justAbove - justBelow)).toBeLessThan(0.02);
});

test('offers a way out part-way through the sequence', () => {
  const { onEnter } = renderGate();
  const skip = screen.getByRole('button', { name: 'Skip intro' });

  fireEvent.click(screen.getByRole('button', { name: 'Enter the portfolio' }));
  advance(ZOOM_SECONDS);

  fireEvent.click(skip);
  expect(onEnter).toHaveBeenCalledTimes(1);
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
