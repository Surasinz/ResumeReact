import { act, fireEvent, render, screen } from '@testing-library/react';
import { ImpactPage, InterviewPage } from './CyberPages';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({ matches: false }),
  });
  Object.defineProperty(window, 'IntersectionObserver', {
    configurable: true,
    value: undefined,
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('renders every impact category and exact metric content', () => {
  render(<ImpactPage />);

  expect(
    screen.getByRole('heading', { name: /Impact Dashboard/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: /Enterprise System & Database Optimization/i,
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: /Workflow Automation & Integration/i,
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', {
      name: /AI-Powered & Quantitative Architecture/i,
    })
  ).toBeInTheDocument();

  [
    'Reduced Processing Time',
    'Records Secured Daily',
    'Faster UI Load Time',
    'Manual Hours Saved/Month',
    'Real-time Payload Accuracy',
    'Automated Trading',
    'Faster Trend Analysis',
  ].forEach((label) => {
    expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
  });

  expect(
    screen.getByText(/targeted CUTOFF_FOR_EBOOK_DATE conditions/i)
  ).toBeInTheDocument();
  expect(screen.getByText(/Gemini API and LangChain frameworks/i)).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /Interactive Interview Terminal/i })
  ).toHaveAttribute('href', '/interview-me');
});

test('switches terminal answers without letting the previous typewriter overlap', () => {
  jest.useFakeTimers();
  render(<InterviewPage />);

  const strengthButton = screen.getByRole('button', {
    name: /What is your core strength/i,
  });
  const bottleneckButton = screen.getByRole('button', {
    name: /How do you handle system bottlenecks/i,
  });

  fireEvent.click(strengthButton);
  act(() => {
    jest.advanceTimersByTime(360);
  });

  const output = document.querySelector('.terminal-answer > [aria-hidden="true"]');
  expect(output.textContent).toContain('I specialize');

  fireEvent.click(bottleneckButton);
  act(() => {
    jest.runAllTimers();
  });

  expect(output.textContent).toBe(
    'I analyze the data flow and pinpoint redundant queries. For example, I implemented targeted processing with specific date cutoffs instead of full-month data sweeps, which reduced processing time by up to 85%.'
  );
  expect(output.textContent).not.toContain('I specialize');
  expect(bottleneckButton).toHaveAttribute('aria-pressed', 'true');
  expect(strengthButton).toHaveAttribute('aria-pressed', 'false');
  expect(document.querySelector('.terminal-answer')).toHaveAttribute(
    'aria-busy',
    'false'
  );
});

test('shows complete terminal answers immediately when reduced motion is preferred', () => {
  window.matchMedia.mockReturnValue({ matches: true });
  render(<InterviewPage />);

  fireEvent.click(
    screen.getByRole('button', { name: /Why should we hire you/i })
  );

  expect(
    document.querySelector('.terminal-answer > [aria-hidden="true"]')
  ).toHaveTextContent(
    "I don't just write code; I build automated, scalable architectures."
  );
  expect(document.querySelector('.terminal-answer')).toHaveAttribute(
    'aria-busy',
    'false'
  );
});
