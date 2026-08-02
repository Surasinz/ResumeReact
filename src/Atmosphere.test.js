import { render } from '@testing-library/react';
import Atmosphere, { GrainOverlay, ScrollProgress } from './Atmosphere';

const setScroll = ({ scrollY, scrollHeight, clientHeight }) => {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: scrollY });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true,
    value: clientHeight,
  });
};

beforeEach(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback();
    return 1;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('reports scroll progress as a ratio of the scrollable distance', () => {
  setScroll({ scrollY: 0, scrollHeight: 3000, clientHeight: 1000 });
  const { container } = render(<ScrollProgress />);
  const bar = container.querySelector('.scroll-progress');

  expect(bar.style.getPropertyValue('--scroll-progress')).toBe('0.0000');

  // Halfway through the 2000px of scrollable distance, not of scrollHeight.
  setScroll({ scrollY: 1000, scrollHeight: 3000, clientHeight: 1000 });
  window.dispatchEvent(new Event('scroll'));
  expect(bar.style.getPropertyValue('--scroll-progress')).toBe('0.5000');

  setScroll({ scrollY: 2000, scrollHeight: 3000, clientHeight: 1000 });
  window.dispatchEvent(new Event('scroll'));
  expect(bar.style.getPropertyValue('--scroll-progress')).toBe('1.0000');
});

test('clamps overscroll and survives a page too short to scroll', () => {
  // Rubber-band scrolling can report a scrollY past the maximum.
  setScroll({ scrollY: 9999, scrollHeight: 3000, clientHeight: 1000 });
  const { container, unmount } = render(<ScrollProgress />);
  const bar = container.querySelector('.scroll-progress');
  expect(bar.style.getPropertyValue('--scroll-progress')).toBe('1.0000');

  unmount();

  // A page shorter than the viewport would otherwise divide by zero.
  setScroll({ scrollY: 0, scrollHeight: 600, clientHeight: 1000 });
  const short = render(<ScrollProgress />);
  expect(
    short.container
      .querySelector('.scroll-progress')
      .style.getPropertyValue('--scroll-progress')
  ).toBe('0.0000');
});

test('detaches its listeners on unmount', () => {
  const removeListener = jest.spyOn(window, 'removeEventListener');
  setScroll({ scrollY: 0, scrollHeight: 3000, clientHeight: 1000 });

  const { unmount } = render(<ScrollProgress />);
  unmount();

  expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function));
});

test('renders decorative layers that never take pointer events', () => {
  setScroll({ scrollY: 0, scrollHeight: 3000, clientHeight: 1000 });
  const { container } = render(<Atmosphere />);

  const grain = container.querySelector('.grain-overlay');
  const bar = container.querySelector('.scroll-progress');

  // Both sit above the page, so a missing aria-hidden would put them in the
  // accessibility tree and a missing pointer-events rule would swallow clicks.
  expect(grain).toHaveAttribute('aria-hidden', 'true');
  expect(bar).toHaveAttribute('aria-hidden', 'true');
  expect(render(<GrainOverlay />).container.firstChild).toHaveClass(
    'grain-overlay'
  );
});
