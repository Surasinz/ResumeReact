import { fireEvent, render, screen } from '@testing-library/react';
import SiteRouter from './SiteRouter';
import { LANGUAGE_STORAGE_KEY } from './LanguageSystem';
import { INTRO_SESSION_KEY } from './IntroGate';

jest.mock('./IntroGate', () => ({
  __esModule: true,
  INTRO_SESSION_KEY: 'surachet-intro-seen',
  // globalThis, not window: jest.mock factories are hoisted above the module
  // scope and may not close over out-of-scope variables.
  hasSeenIntro: () =>
    globalThis.sessionStorage.getItem('surachet-intro-seen') === 'true',
  markIntroSeen: () =>
    globalThis.sessionStorage.setItem('surachet-intro-seen', 'true'),
  default: ({ onEnter }) => (
    <button type="button" onClick={onEnter}>
      INTRO_GATE
    </button>
  ),
}));

jest.mock('./App', () => () => (
  <main id="portfolio-main" tabIndex="-1">PORTFOLIO_PAGE</main>
));
jest.mock('./CyberPages', () => ({
  ImpactPage: () => <div>IMPACT_PAGE</div>,
  InterviewPage: () => <div>INTERVIEW_PAGE</div>,
}));
jest.mock('./NotFoundPage', () => () => <div>NOT_FOUND_PAGE</div>);
jest.mock('./GuestbookGate', () => () => <div>REVIEW_PAGE</div>);
jest.mock('./ComponentDocsPage', () => () => <div>COMPONENT_DOCS_PAGE</div>);

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

test('renders direct portfolio routes without a feedback gate', async () => {
  window.history.replaceState({}, '', '/impact');
  render(<SiteRouter />);

  expect(await screen.findByText('IMPACT_PAGE')).toBeInTheDocument();
  expect(document.title).toBe('Impact Dashboard — Surachet Panto');
  expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
    'content',
    expect.stringContaining('Measured enterprise system')
  );
  expect(screen.queryByText('REVIEW_PAGE')).not.toBeInTheDocument();
});

test('routes review to the standalone feedback terminal', async () => {
  window.history.replaceState({}, '', '/review');
  render(<SiteRouter />);

  expect(await screen.findByText('REVIEW_PAGE')).toBeInTheDocument();
});

test('routes component documentation to its standalone design-system page', async () => {
  window.history.replaceState({}, '', '/components');
  render(<SiteRouter />);

  expect(await screen.findByText('COMPONENT_DOCS_PAGE')).toBeInTheDocument();
});

test('renders unknown paths as the 404 page immediately', async () => {
  window.history.replaceState({}, '', '/unknown-system-route');
  render(<SiteRouter />);

  expect(await screen.findByText('NOT_FOUND_PAGE')).toBeInTheDocument();
});

test('keeps untranslated route content marked as English in Thai mode', () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'th');
  const { container } = render(<SiteRouter />);

  expect(document.documentElement).toHaveAttribute('lang', 'th');
  expect(container.querySelector('.language-content')).toHaveAttribute(
    'lang',
    'en'
  );
});

test('fronts the home page with the intro once per session', () => {
  render(<SiteRouter />);
  expect(screen.getByText('INTRO_GATE')).toBeInTheDocument();
  expect(screen.queryByText('PORTFOLIO_PAGE')).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('INTRO_GATE'));
  expect(screen.getByText('PORTFOLIO_PAGE')).toBeInTheDocument();
  expect(screen.getByText('PORTFOLIO_PAGE')).toHaveFocus();
  expect(window.sessionStorage.getItem(INTRO_SESSION_KEY)).toBe('true');
});

test('does not replay the intro once the session has seen it', () => {
  window.sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
  render(<SiteRouter />);

  // Returning to the portfolio from /impact must not sit the visitor through
  // the sequence again.
  expect(screen.getByText('PORTFOLIO_PAGE')).toBeInTheDocument();
  expect(screen.queryByText('INTRO_GATE')).not.toBeInTheDocument();
});

test('never interrupts a deep link with the intro', async () => {
  for (const [path, marker] of [
    ['/impact', 'IMPACT_PAGE'],
    ['/components', 'COMPONENT_DOCS_PAGE'],
    ['/review', 'REVIEW_PAGE'],
    ['/nope', 'NOT_FOUND_PAGE'],
  ]) {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', path);
    const view = render(<SiteRouter />);
    expect(await screen.findByText(marker)).toBeInTheDocument();
    expect(screen.queryByText('INTRO_GATE')).not.toBeInTheDocument();
    view.unmount();
  }
});

test('holds back the theme and language switches until the intro is through', () => {
  render(<SiteRouter />);

  // The intro is a single composed shot; floating switches over it break that.
  expect(screen.getByText('INTRO_GATE')).toBeInTheDocument();
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('group', { name: 'Select website language' })
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('INTRO_GATE'));

  // They belong to the portfolio, so they arrive with it.
  expect(screen.getByRole('switch')).toBeInTheDocument();
  expect(
    screen.getByRole('group', { name: 'Select website language' })
  ).toBeInTheDocument();
});

test('shows the switches immediately on a deep link', async () => {
  window.history.replaceState({}, '', '/impact');
  render(<SiteRouter />);

  expect(await screen.findByRole('switch')).toBeInTheDocument();
});
