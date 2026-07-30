import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ComponentDocsPage, {
  COMPONENTS,
  PRISM_SCRIPTS,
  PRISM_STYLES,
} from './ComponentDocsPage';

beforeEach(() => {
  window.history.replaceState({}, '', '/components');
  window.Prism = {
    highlightAllUnder: jest.fn(),
    plugins: {
      toolbar: {},
      lineNumbers: {},
      copyToClipboard: true,
    },
    languages: {
      javascript: {},
    },
  };
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
  document
    .querySelectorAll('[data-prism-docs="true"]')
    .forEach((element) => element.remove());
  window.history.replaceState({}, '', '/');
  delete window.Prism;
});

test('renders component navigation, preview, prompt, and Prism-ready code', async () => {
  render(<ComponentDocsPage />);

  expect(
    screen.getByRole('heading', { name: 'Component Documentation' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('navigation', { name: 'Component documentation' })
  ).toBeInTheDocument();
  expect(screen.getByText('Mouse Spotlight Reveal')).toBeInTheDocument();
  expect(screen.getByText('AI Prompt')).toBeInTheDocument();

  const codeBlocks = document.querySelectorAll('pre.line-numbers code');
  expect(codeBlocks).toHaveLength(3);
  expect(codeBlocks[0]).toHaveClass('line-numbers', 'language-html');
  expect(codeBlocks[1]).toHaveClass('line-numbers', 'language-css');
  expect(codeBlocks[2]).toHaveClass('line-numbers', 'language-javascript');
  expect(PRISM_STYLES).toHaveLength(3);
  expect(PRISM_SCRIPTS).toHaveLength(8);
  expect(
    PRISM_STYLES.every((asset) => asset.integrity.startsWith('sha384-'))
  ).toBe(true);
  expect(
    PRISM_SCRIPTS.every((asset) => asset.integrity.startsWith('sha384-'))
  ).toBe(true);
  await waitFor(() => {
    expect(window.Prism.highlightAllUnder).toHaveBeenCalled();
  });
});

test('tracks the spotlight and switches documented components', () => {
  render(<ComponentDocsPage />);
  const spotlight = screen.getByTestId('docs-spotlight');
  jest.spyOn(spotlight, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    top: 50,
    width: 400,
    height: 400,
    right: 500,
    bottom: 450,
    x: 100,
    y: 50,
    toJSON: () => {},
  });

  fireEvent(
    spotlight,
    new MouseEvent('pointermove', {
      bubbles: true,
      clientX: 300,
      clientY: 150,
    })
  );
  expect(spotlight).toHaveClass('is-active');
  expect(spotlight.style.getPropertyValue('--docs-spotlight-x')).toBe('200px');
  expect(spotlight.style.getPropertyValue('--docs-spotlight-y')).toBe('100px');

  fireEvent.pointerLeave(spotlight);
  expect(spotlight).not.toHaveClass('is-active');
  fireEvent.click(spotlight);
  expect(spotlight).toHaveAttribute('aria-pressed', 'true');
  expect(spotlight).toHaveClass('is-pinned');

  const navigation = screen.getByRole('navigation', {
    name: 'Component documentation',
  });
  fireEvent.click(
    within(navigation).getByRole('link', { name: 'Terminal Form' })
  );
  expect(
    screen.getByRole('heading', { name: 'Terminal Feedback Form' })
  ).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
});

test('opens and closes the mobile component menu', async () => {
  window.matchMedia.mockReturnValue({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  render(<ComponentDocsPage />);
  const toggle = screen.getByRole('button', {
    name: 'Toggle component navigation',
  });
  const sidebar = document.querySelector('.docs-sidebar');

  expect(sidebar).toHaveAttribute('inert');
  expect(sidebar).toHaveAttribute('aria-hidden', 'true');

  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(sidebar).toHaveClass('is-open');
  expect(sidebar).not.toHaveAttribute('inert');
  expect(
    screen.getByRole('link', { name: 'Spotlight Avatar' })
  ).toHaveFocus();

  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
    expect(sidebar).toHaveAttribute('inert');
  });
});

test('documents every configured component', () => {
  expect(COMPONENTS.map((component) => component.id)).toEqual([
    'spotlight-avatar',
    'terminal-form',
  ]);
});
