import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';

const createCanvasContext = () => ({
  clearRect: jest.fn(),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  drawImage: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true,
  setTransform: jest.fn(),
  fillStyle: '',
  font: '',
});

beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(createCanvasContext());
  jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the portfolio headline, navigation, and contact details', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Hi, I'm Surachet Panto/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /View Projects/i })).toHaveAttribute('href', '#projects');
  expect(screen.getByRole('link', { name: /Contact Me/i })).toHaveAttribute('href', '#contact');
  expect(screen.getByRole('link', { name: /Experience/i })).toHaveAttribute('href', '#experience');
  expect(document.querySelector('.site-shell > [data-web-shimeji]')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /Copy surachetpan@hotmail.com to clipboard/i })
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /\(\+66\) 88 282 2749/i })).toHaveAttribute(
    'href',
    'tel:+66882822749'
  );
  expect(screen.getAllByRole('link', { name: /LinkedIn/i })[0]).toHaveAttribute(
    'href',
    'https://linkedin.com/in/surachet-panto'
  );
  expect(screen.getAllByRole('link', { name: /GitHub/i })[0]).toHaveAttribute(
    'href',
    'https://github.com/Surasinz'
  );
  expect(
    screen
      .getAllByRole('link', { name: /Impact Dashboard/i })
      .some((link) => link.getAttribute('href') === '/impact')
  ).toBe(true);
  expect(
    screen
      .getAllByRole('link', { name: /Interview Terminal/i })
      .some((link) => link.getAttribute('href') === '/interview-me')
  ).toBe(true);
});

test('copies the contact email and shows confirmation', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  render(<App />);

  fireEvent.click(
    screen.getByRole('button', { name: /Copy surachetpan@hotmail.com to clipboard/i })
  );

  await waitFor(() => {
    expect(writeText).toHaveBeenCalledWith('surachetpan@hotmail.com');
    expect(screen.getByRole('status')).toHaveTextContent('Copied! ✅');
  });
});

test('does not schedule clipboard feedback after unmounting', async () => {
  let resolveCopy;
  const writeText = jest.fn(
    () => new Promise((resolve) => {
      resolveCopy = resolve;
    })
  );
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  const timeoutSpy = jest.spyOn(window, 'setTimeout');
  const { unmount } = render(<App />);

  fireEvent.click(
    screen.getByRole('button', { name: /Copy surachetpan@hotmail.com to clipboard/i })
  );
  unmount();
  const timeoutCallsBeforeResolution = timeoutSpy.mock.calls.length;

  await act(async () => resolveCopy());

  expect(timeoutSpy).toHaveBeenCalledTimes(timeoutCallsBeforeResolution);
  timeoutSpy.mockRestore();
});

test('lets keyboard and touch users pause and resume each skills marquee', () => {
  render(<App />);
  const pauseButton = screen.getByRole('button', {
    name: /Pause programming languages animation/i,
  });
  const marquee = pauseButton.closest('.skill-marquee');

  fireEvent.click(pauseButton);
  expect(pauseButton).toHaveAttribute('aria-pressed', 'true');
  expect(marquee.querySelector('.marquee-track')).toHaveClass('is-paused');

  fireEvent.click(pauseButton);
  expect(
    screen.getByRole('button', { name: /Pause programming languages animation/i })
  ).toHaveAttribute('aria-pressed', 'false');
  expect(marquee.querySelector('.marquee-track')).not.toHaveClass('is-paused');
});

test('toggles the Pixel Liquid background and restores the saved preference', () => {
  const { unmount } = render(<App />);
  const disableButton = screen.getByRole('switch', {
    name: /Pixel liquid background animation/i,
  });

  expect(disableButton).toHaveAttribute('aria-checked', 'true');
  fireEvent.click(disableButton);
  expect(
    window.localStorage.getItem('surachet-pixel-liquid-animation')
  ).toBe('false');
  expect(
    screen.getByRole('switch', { name: /Pixel liquid background animation/i })
  ).toHaveAttribute('aria-checked', 'false');

  unmount();
  render(<App />);
  expect(
    screen.getByRole('switch', { name: /Pixel liquid background animation/i })
  ).toHaveAttribute('aria-checked', 'false');
});

test('defaults the Pixel Liquid background to off when reduced motion is preferred', () => {
  window.matchMedia.mockReturnValue({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });

  render(<App />);

  expect(
    screen.getByRole('switch', { name: /Pixel liquid background animation/i })
  ).toHaveAttribute('aria-checked', 'false');
  expect(
    window.localStorage.getItem('surachet-pixel-liquid-animation')
  ).toBeNull();
});

test('renders the Pixel Liquid canvas in exact 3px blocks and releases resources', () => {
  const removeEventListener = jest.spyOn(window, 'removeEventListener');
  const { container, unmount } = render(<App />);
  const canvas = container.querySelector('.pixel-liquid-background');

  expect(canvas.width).toBeGreaterThan(0);
  expect(canvas.height).toBeGreaterThan(0);
  expect(canvas.width % 3).toBe(0);
  expect(canvas.height % 3).toBe(0);
  expect(canvas).toHaveAttribute('data-pixel-size', '3');
  expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(2);

  unmount();
  expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
});

test('tilts the featured project visual toward the pointer and resets on leave', () => {
  render(<App />);
  const tiltArea = screen.getByTestId('project-tilt');
  const visual = tiltArea.firstElementChild;
  jest.spyOn(visual, 'getBoundingClientRect').mockReturnValue({
    bottom: 100,
    height: 100,
    left: 0,
    right: 200,
    top: 0,
    width: 200,
    x: 0,
    y: 0,
    toJSON: () => {},
  });

  fireEvent.mouseMove(tiltArea, { clientX: 200, clientY: 0 });
  expect(visual.style.getPropertyValue('--tilt-x')).toBe('5deg');
  expect(visual.style.getPropertyValue('--tilt-y')).toBe('5deg');

  fireEvent.mouseLeave(tiltArea);
  expect(visual.style.getPropertyValue('--tilt-x')).toBe('0deg');
  expect(visual.style.getPropertyValue('--tilt-y')).toBe('0deg');
});

test('tracks the pointer position across the avatar spotlight', () => {
  render(<App />);
  const spotlight = screen.getByTestId('avatar-spotlight');
  const defaultImage = spotlight.querySelector('.avatar-image-default');
  const revealImage = spotlight.querySelector('.avatar-image-reveal');

  expect(defaultImage).toHaveAttribute('src', '/surachet-avatar.webp');
  expect(revealImage).toHaveAttribute('src', '/avatar-formal.webp');
  expect(within(spotlight).getByText(/Enterprise builder/i)).toBeInTheDocument();
  expect(within(spotlight).getByText(/Nonthaburi, TH/i)).toBeInTheDocument();

  jest.spyOn(spotlight, 'getBoundingClientRect').mockReturnValue({
    bottom: 500,
    height: 400,
    left: 100,
    right: 300,
    top: 100,
    width: 200,
    x: 100,
    y: 100,
    toJSON: () => {},
  });

  fireEvent.mouseEnter(spotlight, { clientX: 250, clientY: 200 });
  expect(spotlight).toHaveClass('is-spotlight-active');
  expect(spotlight.style.getPropertyValue('--spotlight-x')).toBe('75%');
  expect(spotlight.style.getPropertyValue('--spotlight-y')).toBe('25%');

  fireEvent.mouseMove(spotlight, { clientX: 200, clientY: 300 });
  expect(spotlight.style.getPropertyValue('--spotlight-x')).toBe('50%');
  expect(spotlight.style.getPropertyValue('--spotlight-y')).toBe('50%');

  fireEvent.mouseLeave(spotlight);
  expect(spotlight).not.toHaveClass('is-spotlight-active');
});

test('keeps section navigation available at a narrow viewport', () => {
  window.innerWidth = 375;
  window.dispatchEvent(new Event('resize'));
  render(<App />);

  const navigation = screen.getByRole('navigation', { name: /Main navigation/i });
  expect(navigation).toBeInTheDocument();
  expect(within(navigation).getByRole('link', { name: /About/i })).toHaveAttribute('href', '#about');
  expect(within(navigation).getByRole('link', { name: /Projects/i })).toHaveAttribute(
    'href',
    '#projects'
  );
});

test('adds glass styling after scroll and moves the indicator between nav links', () => {
  render(<App />);
  const topbar = document.querySelector('.topbar');
  const navigation = screen.getByRole('navigation', { name: /Main navigation/i });
  const aboutLink = within(navigation).getByRole('link', { name: /About/i });
  const experienceLink = within(navigation).getByRole('link', {
    name: /Experience/i,
  });
  const projectsLink = within(navigation).getByRole('link', { name: /Projects/i });

  expect(topbar).not.toHaveClass('is-scrolled');

  jest.spyOn(navigation, 'getBoundingClientRect').mockReturnValue({
    bottom: 60,
    height: 30,
    left: 100,
    right: 500,
    top: 30,
    width: 400,
    x: 100,
    y: 30,
    toJSON: () => {},
  });
  const aboutLinkRect = jest
    .spyOn(aboutLink, 'getBoundingClientRect')
    .mockReturnValue({
      bottom: 55,
      height: 20,
      left: 100,
      right: 160,
      top: 35,
      width: 60,
      x: 100,
      y: 35,
      toJSON: () => {},
    });
  jest.spyOn(experienceLink, 'getBoundingClientRect').mockReturnValue({
    bottom: 55,
    height: 20,
    left: 220,
    right: 320,
    top: 35,
    width: 100,
    x: 220,
    y: 35,
    toJSON: () => {},
  });
  jest.spyOn(projectsLink, 'getBoundingClientRect').mockReturnValue({
    bottom: 55,
    height: 20,
    left: 360,
    right: 440,
    top: 35,
    width: 80,
    x: 360,
    y: 35,
    toJSON: () => {},
  });

  jest.spyOn(document.getElementById('about'), 'getBoundingClientRect').mockReturnValue({
    top: -400,
  });
  jest
    .spyOn(document.getElementById('experience'), 'getBoundingClientRect')
    .mockReturnValue({ top: 40 });
  const projectsSectionRect = jest
    .spyOn(document.getElementById('projects'), 'getBoundingClientRect')
    .mockReturnValue({ top: 900 });

  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: 200,
  });
  window.requestAnimationFrame.mockImplementationOnce((callback) => {
    callback();
    return null;
  });
  fireEvent.scroll(window);

  expect(topbar).toHaveClass('is-scrolled');
  expect(experienceLink).toHaveClass('is-active');
  expect(experienceLink).toHaveAttribute('aria-current', 'location');

  fireEvent.mouseEnter(aboutLink);
  expect(navigation.style.getPropertyValue('--indicator-x')).toBe('0px');
  expect(navigation.style.getPropertyValue('--indicator-width')).toBe('60px');

  projectsSectionRect.mockReturnValue({ top: 40 });
  window.requestAnimationFrame.mockImplementationOnce((callback) => {
    callback();
    return null;
  });
  fireEvent.scroll(window);
  expect(projectsLink).toHaveClass('is-active');
  expect(projectsLink).toHaveAttribute('aria-current', 'location');
  expect(experienceLink).not.toHaveAttribute('aria-current');
  expect(navigation.style.getPropertyValue('--indicator-x')).toBe('0px');
  expect(navigation.style.getPropertyValue('--indicator-width')).toBe('60px');

  fireEvent.mouseLeave(navigation);
  expect(navigation.style.getPropertyValue('--indicator-x')).toBe('260px');
  expect(navigation.style.getPropertyValue('--indicator-width')).toBe('80px');

  fireEvent.focus(experienceLink);
  expect(navigation.style.getPropertyValue('--indicator-x')).toBe('120px');

  fireEvent.mouseEnter(aboutLink);
  aboutLinkRect.mockReturnValue({
    bottom: 55,
    height: 20,
    left: 110,
    right: 180,
    top: 35,
    width: 70,
    x: 110,
    y: 35,
    toJSON: () => {},
  });
  fireEvent(window, new Event('resize'));
  expect(navigation.style.getPropertyValue('--indicator-x')).toBe('10px');
  expect(navigation.style.getPropertyValue('--indicator-width')).toBe('70px');

  fireEvent.mouseLeave(navigation);
  expect(navigation.style.getPropertyValue('--indicator-x')).toBe('120px');

  fireEvent.mouseEnter(aboutLink);
  fireEvent.blur(experienceLink, { relatedTarget: document.body });
  expect(navigation.style.getPropertyValue('--indicator-x')).toBe('10px');

  fireEvent.mouseLeave(navigation);
  expect(navigation.style.getPropertyValue('--indicator-x')).toBe('260px');
  expect(aboutLink).not.toHaveClass('is-active');
});
