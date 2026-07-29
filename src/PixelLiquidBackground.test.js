import { act, fireEvent, render } from '@testing-library/react';
import PixelLiquidBackground, { SMOKE_SCALE } from './PixelLiquidBackground';

const createContext = () => ({
  clearRect: jest.fn(),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  drawImage: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: '',
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true,
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('adds pointer smoke only during RAF and cleans up', () => {
  expect(SMOKE_SCALE).toBe(1.5);
  const mainContext = createContext();
  const bufferContext = createContext();
  let frameCallback;

  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValueOnce(mainContext)
    .mockReturnValueOnce(bufferContext);
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frameCallback = callback;
    return 7;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const removeWindowListener = jest.spyOn(window, 'removeEventListener');
  const removeRootListener = jest.spyOn(
    document.documentElement,
    'removeEventListener'
  );

  const { container, unmount } = render(
    <PixelLiquidBackground enabled />
  );
  const canvas = container.querySelector('.pixel-liquid-background');

  fireEvent.pointerMove(window, { clientX: 30, clientY: 40 });
  fireEvent.pointerMove(window, { clientX: 60, clientY: 80 });
  fireEvent.pointerMove(window, { clientX: 90, clientY: 120 });
  expect(bufferContext.createRadialGradient).not.toHaveBeenCalled();

  act(() => frameCallback(40));

  expect(canvas.width % 3).toBe(0);
  expect(canvas.height % 3).toBe(0);
  expect(canvas).toHaveAttribute('data-pixel-size', '3');
  expect(bufferContext.createRadialGradient).toHaveBeenCalledTimes(4);
  expect(mainContext.imageSmoothingEnabled).toBe(false);
  expect(mainContext.drawImage).toHaveBeenCalledTimes(1);

  unmount();
  expect(window.cancelAnimationFrame).toHaveBeenCalledWith(7);
  expect(removeWindowListener).toHaveBeenCalledWith(
    'pointermove',
    expect.any(Function)
  );
  expect(removeRootListener).toHaveBeenCalledWith(
    'pointerleave',
    expect.any(Function)
  );
});
