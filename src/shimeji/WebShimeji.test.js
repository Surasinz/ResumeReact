import WebShimeji, { SHIMEJI_STATES } from './WebShimeji';

const setViewport = (width, height) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
};

beforeEach(() => {
  document.querySelectorAll('[data-web-shimeji]').forEach((element) => element.remove());
  setViewport(800, 600);
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({ matches: false }),
  });
  jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(17);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  document.querySelectorAll('[data-web-shimeji]').forEach((element) => element.remove());
});

test('injects the mascot and selects sprite frames from the configured atlas', () => {
  const mascot = new WebShimeji({ spriteUrl: '/builder-bot-sprite.webp' }).mount();

  expect(mascot.element).toBeInTheDocument();
  expect(mascot.element).toHaveAttribute('data-state', SHIMEJI_STATES.Falling);
  expect(mascot.element.style.backgroundImage).toContain('builder-bot-sprite.webp');
  expect(mascot.element.style.backgroundSize).toBe('896px 640px');
  expect(mascot.element.style.backgroundPosition).toBe('0px -384px');

  mascot.setState(SHIMEJI_STATES.Working);
  expect(mascot.element.style.backgroundPosition).toBe('0px -512px');

  mascot.position = { x: 12.345, y: 67.891 };
  mascot.renderPosition();
  expect(mascot.element.style.transform).toBe(
    'translate3d(12.35px, 67.89px, 0) scaleX(1)'
  );

  mascot.setState(SHIMEJI_STATES.WalkLeft);
  expect(mascot.element.style.transform).toContain('scaleX(-1)');
  mascot.setState(SHIMEJI_STATES.Idle);
  expect(mascot.element.style.transform).toContain('scaleX(-1)');

  mascot.destroy();
  expect(document.querySelector('[data-web-shimeji]')).not.toBeInTheDocument();
  expect(window.cancelAnimationFrame).toHaveBeenCalledWith(17);
});

test('supports bounded drag and drop before returning to Falling', () => {
  const mascot = new WebShimeji({ spriteUrl: '/builder-bot-sprite.webp' }).mount();
  jest.spyOn(mascot.element, 'getBoundingClientRect').mockReturnValue({
    bottom: 144,
    height: 128,
    left: 640,
    right: 768,
    top: 16,
    width: 128,
    x: 640,
    y: 16,
    toJSON: () => {},
  });

  mascot.element.dispatchEvent(
    new MouseEvent('mousedown', {
      bubbles: true,
      button: 0,
      clientX: 680,
      clientY: 40,
    })
  );
  expect(mascot.state).toBe(SHIMEJI_STATES.Dragged);
  expect(mascot.element).toHaveClass('is-dragging');

  window.dispatchEvent(
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: -200,
      clientY: 900,
    })
  );
  expect(mascot.position.x).toBe(0);
  expect(mascot.position.y).toBe(mascot.getMaximumY());

  window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  expect(mascot.state).toBe(SHIMEJI_STATES.Falling);
  expect(mascot.element).not.toHaveClass('is-dragging');

  mascot.destroy();
});

test('applies gravity, walking bounds, and updated viewport bounds', () => {
  const mascot = new WebShimeji({
    spriteUrl: '/builder-bot-sprite.webp',
    fallSpeed: 10000,
    random: () => 0,
  }).mount();

  mascot.position.y = 0;
  mascot.setState(SHIMEJI_STATES.Falling);
  mascot.updatePhysics(1, performance.now());
  expect(mascot.position.y).toBe(mascot.getGroundY());
  expect(mascot.state).toBe(SHIMEJI_STATES.Idle);

  mascot.position.x = mascot.getMaximumX() - 1;
  mascot.setState(SHIMEJI_STATES.WalkRight, 5000);
  mascot.updatePhysics(1, performance.now());
  expect(mascot.position.x).toBe(mascot.getMaximumX());
  expect(mascot.state).toBe(SHIMEJI_STATES.Idle);

  setViewport(320, 480);
  mascot.position.x = 900;
  mascot.position.y = 900;
  window.dispatchEvent(new Event('resize'));
  expect(mascot.position.x).toBe(mascot.getMaximumX());
  expect(mascot.position.y).toBeLessThanOrEqual(mascot.getMaximumY());
  expect(mascot.state).toBe(SHIMEJI_STATES.Falling);

  mascot.destroy();
});

test('stays idle on the ground when reduced motion is requested', () => {
  window.matchMedia.mockReturnValue({ matches: true });
  const mascot = new WebShimeji({ spriteUrl: '/builder-bot-sprite.webp' }).mount();

  expect(mascot.state).toBe(SHIMEJI_STATES.Idle);
  expect(mascot.position.y).toBe(mascot.getGroundY());
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();

  mascot.destroy();
});

test('responds to reduced-motion preference changes and removes the listener', () => {
  let motionPreferenceHandler;
  const motionPreference = {
    matches: false,
    addEventListener: jest.fn((eventName, handler) => {
      if (eventName === 'change') motionPreferenceHandler = handler;
    }),
    removeEventListener: jest.fn(),
  };
  window.matchMedia.mockReturnValue(motionPreference);

  const mascot = new WebShimeji({ spriteUrl: '/builder-bot-sprite.webp' }).mount();

  expect(motionPreference.addEventListener).toHaveBeenCalledWith(
    'change',
    expect.any(Function)
  );

  motionPreferenceHandler({ matches: true });
  expect(mascot.reducedMotion).toBe(true);
  expect(mascot.state).toBe(SHIMEJI_STATES.Idle);
  expect(mascot.position.y).toBe(mascot.getGroundY());
  expect(window.cancelAnimationFrame).toHaveBeenCalledWith(17);

  motionPreferenceHandler({ matches: false });
  expect(mascot.reducedMotion).toBe(false);
  expect(window.requestAnimationFrame).toHaveBeenCalledTimes(2);

  const registeredHandler = motionPreferenceHandler;
  mascot.destroy();
  expect(motionPreference.removeEventListener).toHaveBeenCalledWith(
    'change',
    registeredHandler
  );
});

test('bounds a contained mascot to its container and drags in its space', () => {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  // jsdom reports 0 for layout, so stand in for a 500x300 box at (200, 100).
  Object.defineProperty(stage, 'clientWidth', { configurable: true, value: 500 });
  Object.defineProperty(stage, 'clientHeight', { configurable: true, value: 300 });
  jest.spyOn(stage, 'getBoundingClientRect').mockReturnValue({
    left: 200,
    top: 100,
    right: 700,
    bottom: 400,
    width: 500,
    height: 300,
    x: 200,
    y: 100,
    toJSON: () => {},
  });

  const mascot = new WebShimeji({
    spriteUrl: '/builder-bot-sprite.webp',
    container: stage,
    displayWidth: 100,
  }).mount();

  // Mounted inside the container, not the page shell, and marked so CSS can
  // switch it from fixed to absolute positioning.
  expect(mascot.element.parentElement).toBe(stage);
  expect(mascot.element).toHaveClass('is-contained');

  // Bounds come from the container, not the 800x600 viewport.
  expect(mascot.getMaximumX()).toBe(400);
  expect(mascot.getMaximumY()).toBe(200);

  jest.spyOn(mascot.element, 'getBoundingClientRect').mockReturnValue({
    left: 200,
    top: 100,
    width: 100,
    height: 100,
    right: 300,
    bottom: 200,
    x: 200,
    y: 100,
    toJSON: () => {},
  });
  mascot.element.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 200, clientY: 100 })
  );

  // Grabbed at the element's corner, so dropping the pointer at (450, 250)
  // should land the mascot at (250, 150) *within the container* -- without
  // subtracting the container origin it would be pushed to (450, 250).
  window.dispatchEvent(
    new MouseEvent('mousemove', { bubbles: true, clientX: 450, clientY: 250 })
  );
  expect(mascot.position.x).toBe(250);
  expect(mascot.position.y).toBe(150);

  // Still clamped, and clamped to the container rather than the viewport.
  window.dispatchEvent(
    new MouseEvent('mousemove', { bubbles: true, clientX: 5000, clientY: 5000 })
  );
  expect(mascot.position.x).toBe(400);
  expect(mascot.position.y).toBe(200);

  mascot.destroy();
  expect(stage.querySelector('[data-web-shimeji]')).toBeNull();
  stage.remove();
});
