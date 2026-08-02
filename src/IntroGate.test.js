import { act, fireEvent, render, screen } from '@testing-library/react';
import IntroGate, {
  INTRO_SESSION_KEY,
  hasSeenIntro,
  markIntroSeen,
} from './IntroGate';
import { LanguageProvider } from './LanguageSystem';
import { ThemeProvider } from './ThemeSystem';

// The assembly itself needs WebGL, which jsdom has no answer for. The entry
// control deliberately does not depend on it, which is what these cover.
// Stands in for the whole 3D subtree. Rendering the children would hand r3f
// primitives like <ambientLight> to the DOM renderer, which only produces
// casing warnings -- the scene is not what these tests are about.
jest.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="intro-canvas" />,
  useFrame: () => {},
  useThree: () => ({ viewport: { width: 8, height: 5 } }),
}));

const renderGate = (onEnter = jest.fn()) => {
  const utils = render(
    <ThemeProvider>
      <LanguageProvider>
        <IntroGate onEnter={onEnter} />
      </LanguageProvider>
    </ThemeProvider>
  );
  return { ...utils, onEnter };
};

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

test('reveals the entry control on a timer rather than from the render loop', () => {
  const { container } = renderGate();
  const gate = container.querySelector('.intro-gate');

  // Hidden while the machine assembles...
  expect(gate).toHaveAttribute('data-ready', 'false');

  act(() => {
    jest.advanceTimersByTime(4000);
  });

  // ...and shown purely on elapsed time, so a stalled or absent WebGL
  // context can never leave the visitor with no way forward.
  expect(gate).toHaveAttribute('data-ready', 'true');
});

test('offers a way out from the first frame, before the machine is built', () => {
  const { onEnter } = renderGate();

  fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }));
  expect(onEnter).toHaveBeenCalledTimes(1);
});

test('enters the portfolio from the screen control', () => {
  const { onEnter } = renderGate();
  act(() => {
    jest.advanceTimersByTime(4000);
  });

  fireEvent.click(screen.getByRole('button', { name: 'Enter the portfolio' }));
  expect(onEnter).toHaveBeenCalledTimes(1);
});

test('skips the build entirely when reduced motion is requested', () => {
  window.matchMedia.mockReturnValue({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });

  const { container } = renderGate();

  // Ready on the first paint, with no timer to wait through.
  expect(container.querySelector('.intro-gate')).toHaveAttribute(
    'data-ready',
    'true'
  );
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
