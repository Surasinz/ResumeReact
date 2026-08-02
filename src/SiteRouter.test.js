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

jest.mock('./App', () => () => <div>PORTFOLIO_PAGE</div>);
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

test('renders direct portfolio routes without a feedback gate', () => {
  window.history.replaceState({}, '', '/impact');
  render(<SiteRouter />);

  expect(screen.getByText('IMPACT_PAGE')).toBeInTheDocument();
  expect(screen.queryByText('REVIEW_PAGE')).not.toBeInTheDocument();
});

test('routes review to the standalone feedback terminal', () => {
  window.history.replaceState({}, '', '/review');
  render(<SiteRouter />);

  expect(screen.getByText('REVIEW_PAGE')).toBeInTheDocument();
});

test('routes component documentation to its standalone design-system page', () => {
  window.history.replaceState({}, '', '/components');
  render(<SiteRouter />);

  expect(screen.getByText('COMPONENT_DOCS_PAGE')).toBeInTheDocument();
});

test('renders unknown paths as the 404 page immediately', () => {
  window.history.replaceState({}, '', '/unknown-system-route');
  render(<SiteRouter />);

  expect(screen.getByText('NOT_FOUND_PAGE')).toBeInTheDocument();
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

test('never interrupts a deep link with the intro', () => {
  for (const [path, marker] of [
    ['/impact', 'IMPACT_PAGE'],
    ['/components', 'COMPONENT_DOCS_PAGE'],
    ['/review', 'REVIEW_PAGE'],
    ['/nope', 'NOT_FOUND_PAGE'],
  ]) {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', path);
    const view = render(<SiteRouter />);
    expect(screen.getByText(marker)).toBeInTheDocument();
    expect(screen.queryByText('INTRO_GATE')).not.toBeInTheDocument();
    view.unmount();
  }
});
