import { render } from '@testing-library/react';
import MatrixRainBackground from './MatrixRainBackground';
import { THEME_STORAGE_KEY, ThemeProvider } from './ThemeSystem';

afterEach(() => {
  jest.restoreAllMocks();
  window.localStorage.clear();
});

test('starts Matrix Rain and releases its own RAF and resize listener', () => {
  const context = {
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    setTransform: jest.fn(),
    fillStyle: '',
    font: '',
  };
  const removeEventListener = jest.spyOn(window, 'removeEventListener');

  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(context);
  jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(13);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

  const { container, unmount } = render(
    <MatrixRainBackground enabled />
  );

  expect(container.querySelector('.matrix-background.is-enabled')).toBeInTheDocument();
  expect(context.setTransform).toHaveBeenCalled();

  unmount();
  expect(window.cancelAnimationFrame).toHaveBeenCalledWith(13);
  expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
});

test.each([
  ['light', '#39ff14'],
  ['dark', '#ff35a2'],
])('adapts rain color to the %s theme', (theme, expectedColor) => {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);

  const { container } = render(
    <ThemeProvider>
      <MatrixRainBackground enabled={false} />
    </ThemeProvider>
  );

  expect(container.querySelector('canvas')).toHaveAttribute(
    'data-rain-color',
    expectedColor
  );
});
