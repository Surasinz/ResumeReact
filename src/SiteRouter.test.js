import { render, screen } from '@testing-library/react';
import SiteRouter from './SiteRouter';

jest.mock('./App', () => () => <div>PORTFOLIO_PAGE</div>);
jest.mock('./CyberPages', () => ({
  ImpactPage: () => <div>IMPACT_PAGE</div>,
  InterviewPage: () => <div>INTERVIEW_PAGE</div>,
}));
jest.mock('./NotFoundPage', () => () => <div>NOT_FOUND_PAGE</div>);
jest.mock('./GuestbookGate', () => () => <div>REVIEW_PAGE</div>);

beforeEach(() => {
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

test('renders unknown paths as the 404 page immediately', () => {
  window.history.replaceState({}, '', '/unknown-system-route');
  render(<SiteRouter />);

  expect(screen.getByText('NOT_FOUND_PAGE')).toBeInTheDocument();
});
