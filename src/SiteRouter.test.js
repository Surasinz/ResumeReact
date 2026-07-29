import { fireEvent, render, screen } from '@testing-library/react';
import SiteRouter, { GUESTBOOK_ACCESS_KEY } from './SiteRouter';

jest.mock('./App', () => () => <div>PORTFOLIO_PAGE</div>);
jest.mock('./CyberPages', () => ({
  ImpactPage: () => <div>IMPACT_PAGE</div>,
  InterviewPage: () => <div>INTERVIEW_PAGE</div>,
}));
jest.mock('./NotFoundPage', () => () => <div>NOT_FOUND_PAGE</div>);
jest.mock('./GuestbookGate', () => ({ onEnter }) => (
  <button type="button" onClick={onEnter}>
    GUESTBOOK_GATE
  </button>
));

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

test('shows the gate before a direct route and remembers access for the session', () => {
  window.history.replaceState({}, '', '/impact');
  render(<SiteRouter />);

  expect(screen.getByRole('button', { name: 'GUESTBOOK_GATE' })).toBeInTheDocument();
  expect(screen.queryByText('IMPACT_PAGE')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'GUESTBOOK_GATE' }));

  expect(screen.getByText('IMPACT_PAGE')).toBeInTheDocument();
  expect(window.sessionStorage.getItem(GUESTBOOK_ACCESS_KEY)).toBe('granted');
});

test('routes returning session visitors without showing the gate again', () => {
  window.sessionStorage.setItem(GUESTBOOK_ACCESS_KEY, 'granted');
  window.history.replaceState({}, '', '/interview-me');

  render(<SiteRouter />);

  expect(screen.getByText('INTERVIEW_PAGE')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'GUESTBOOK_GATE' })).not.toBeInTheDocument();
});

test('keeps unknown paths behind the same gate before rendering the 404 page', () => {
  window.history.replaceState({}, '', '/unknown-system-route');
  const { rerender } = render(<SiteRouter />);

  expect(screen.getByRole('button', { name: 'GUESTBOOK_GATE' })).toBeInTheDocument();

  window.sessionStorage.setItem(GUESTBOOK_ACCESS_KEY, 'granted');
  rerender(<SiteRouter key="with-access" />);

  expect(screen.getByText('NOT_FOUND_PAGE')).toBeInTheDocument();
});
