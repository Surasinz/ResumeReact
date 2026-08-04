import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import IntroGate, {
  EXIT_SECONDS,
  INTRO_SESSION_KEY,
  VIDEO_TIMEOUT_MS,
  getNextVideoPhase,
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

const advanceMilliseconds = (milliseconds) => {
  act(() => {
    jest.advanceTimersByTime(milliseconds + 20);
  });
};

beforeEach(() => {
  window.sessionStorage.clear();
  jest.useFakeTimers();
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
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
  jest.restoreAllMocks();
});

test('waits on the looping idle render until the visitor enters', () => {
  const { gate, onEnter } = renderGate();

  expect(gate).toHaveAttribute('data-phase', 'idle');
  expect(screen.getByTestId('intro-video-idle')).toHaveAttribute('loop');
  expect(screen.getByTestId('intro-video-idle')).toHaveClass('is-active');

  advanceMilliseconds(60000);
  expect(gate).toHaveAttribute('data-phase', 'idle');
  expect(onEnter).not.toHaveBeenCalled();
});

test('plays approach and access renders in order before handing over', () => {
  const { gate, onEnter } = renderGate();
  const enter = screen.getByRole('button', { name: 'Enter the portfolio' });
  const skip = screen.getByRole('button', { name: 'Skip intro' });

  fireEvent.click(enter);
  expect(gate).toHaveAttribute('data-phase', 'approach');
  expect(screen.getByTestId('intro-video-idle')).toHaveClass('is-active');
  expect(screen.getByTestId('intro-video-approach')).not.toHaveClass('is-active');
  expect(skip).toHaveFocus();
  expect(enter).toBeDisabled();
  expect(enter).toHaveAttribute('tabindex', '-1');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Moving into the secure monitor'
  );

  const approachVideo = screen.getByTestId('intro-video-approach');
  HTMLMediaElement.prototype.pause.mockClear();
  fireEvent.playing(approachVideo);
  expect(approachVideo).toHaveClass('is-active');
  expect(HTMLMediaElement.prototype.pause.mock.instances).not.toContain(
    approachVideo
  );

  fireEvent.ended(screen.getByTestId('intro-video-approach'));
  expect(gate).toHaveAttribute('data-phase', 'access');
  expect(screen.getByTestId('intro-video-approach')).toHaveClass('is-active');
  expect(screen.getByTestId('intro-video-access')).not.toHaveClass('is-active');

  fireEvent.playing(screen.getByTestId('intro-video-access'));
  expect(screen.getByTestId('intro-video-access')).toHaveClass('is-active');
  expect(screen.getByRole('status')).toHaveTextContent('Loading portfolio');

  fireEvent.ended(screen.getByTestId('intro-video-access'));
  expect(gate).toHaveAttribute('data-phase', 'exiting');
  expect(screen.getByTestId('intro-video-access')).toHaveClass('is-active');
  expect(onEnter).not.toHaveBeenCalled();

  advanceMilliseconds(EXIT_SECONDS * 1000);
  expect(onEnter).toHaveBeenCalledTimes(1);
});

test('preloads all three Unreal renders for seamless transitions', () => {
  renderGate();

  expect(screen.getAllByTestId(/intro-video-/)).toHaveLength(3);
  screen.getAllByTestId(/intro-video-/).forEach((video) => {
    expect(video).toHaveAttribute('preload', 'auto');
    expect(video).toHaveAttribute('playsinline');
  });
});

test('has a deterministic fallback when a clip never finishes', () => {
  const { gate, onEnter } = renderGate();

  fireEvent.click(screen.getByRole('button', { name: 'Enter the portfolio' }));
  expect(screen.getByTestId('intro-video-idle')).toHaveClass('is-active');
  advanceMilliseconds(VIDEO_TIMEOUT_MS);
  expect(gate).toHaveAttribute('data-phase', 'access');
  expect(screen.getByTestId('intro-video-idle')).toHaveClass('is-active');

  fireEvent.playing(screen.getByTestId('intro-video-access'));
  expect(screen.getByTestId('intro-video-access')).toHaveClass('is-active');

  advanceMilliseconds(VIDEO_TIMEOUT_MS);
  expect(gate).toHaveAttribute('data-phase', 'exiting');
  advanceMilliseconds(EXIT_SECONDS * 1000);
  expect(onEnter).toHaveBeenCalledTimes(1);
});

test('maps only finite clips to their next phase', () => {
  expect(getNextVideoPhase('idle')).toBe('idle');
  expect(getNextVideoPhase('approach')).toBe('access');
  expect(getNextVideoPhase('access')).toBe('exiting');
  expect(getNextVideoPhase('exiting')).toBe('exiting');
});

test('offers a way out part-way through the sequence', () => {
  const { onEnter } = renderGate();

  fireEvent.click(screen.getByRole('button', { name: 'Enter the portfolio' }));
  fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }));

  expect(onEnter).toHaveBeenCalledTimes(1);
});

test('stops every media decoder when the intro unmounts', () => {
  const { unmount } = renderGate();
  HTMLMediaElement.prototype.pause.mockClear();

  unmount();

  expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(3);
});

test('retains media refs through the StrictMode effect replay', () => {
  render(
    <StrictMode>
      <ThemeProvider>
        <LanguageProvider>
          <IntroGate onEnter={jest.fn()} />
        </LanguageProvider>
      </ThemeProvider>
    </StrictMode>
  );
  HTMLMediaElement.prototype.play.mockClear();

  fireEvent.click(screen.getByRole('button', { name: 'Enter the portfolio' }));

  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('intro-video-approach')).toBeInTheDocument();
});

test('skips straight through when reduced motion is requested', () => {
  window.matchMedia.mockReturnValue({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  const { onEnter, gate } = renderGate();

  fireEvent.click(screen.getByRole('button', { name: 'Enter the portfolio' }));

  expect(onEnter).toHaveBeenCalledTimes(1);
  expect(gate).toHaveAttribute('data-phase', 'idle');
});

test('remembers the intro for the session and survives blocked storage', () => {
  expect(hasSeenIntro()).toBe(false);
  markIntroSeen();
  expect(window.sessionStorage.getItem(INTRO_SESSION_KEY)).toBe('true');
  expect(hasSeenIntro()).toBe(true);

  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('storage disabled');
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('storage disabled');
  });

  expect(() => markIntroSeen()).not.toThrow();
  expect(hasSeenIntro()).toBe(false);
});
