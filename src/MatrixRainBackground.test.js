import { render } from '@testing-library/react';
import MatrixRainBackground from './MatrixRainBackground';

afterEach(() => {
  jest.restoreAllMocks();
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
