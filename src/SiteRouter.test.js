import { render, screen } from '@testing-library/react';
import SiteRouter from './SiteRouter';
import { LANGUAGE_STORAGE_KEY } from './LanguageSystem';

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
