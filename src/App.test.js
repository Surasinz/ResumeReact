import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';

test('renders the portfolio headline, navigation, and contact details', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Hi, I'm Surachet Panto/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /View Projects/i })).toHaveAttribute('href', '#projects');
  expect(screen.getByRole('link', { name: /Contact Me/i })).toHaveAttribute('href', '#contact');
  expect(screen.getByRole('link', { name: /Experience/i })).toHaveAttribute('href', '#experience');
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
