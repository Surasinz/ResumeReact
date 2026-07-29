import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GuestbookGate, { FORMSPREE_ENDPOINT } from './GuestbookGate';

beforeEach(() => {
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    value: jest.fn(),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the standalone Formspree form and switches visitor-specific fields', () => {
  render(<GuestbookGate />);
  const form = document.querySelector('form');

  expect(form).toHaveAttribute('action', FORMSPREE_ENDPOINT);
  expect(form).toHaveAttribute('method', 'POST');
  expect(form.querySelector('input[name="_subject"]')).toHaveValue(
    'New Website Visitor & Feedback!'
  );
  expect(form.querySelector('input[name="visitor_type"]')).toHaveValue('visitor');
  expect(screen.getByLabelText(/01 \/\/ Name/i)).toHaveAttribute(
    'name',
    'visitor_name'
  );
  expect(form.querySelector('[name="company_name"]')).not.toBeInTheDocument();
  expect(screen.getByLabelText(/Website Feedback/i)).toHaveAttribute(
    'name',
    'website_feedback'
  );

  fireEvent.click(
    screen.getByRole('button', { name: /\[ HR \/ Recruiter \]/i })
  );

  expect(form.querySelector('input[name="visitor_type"]')).toHaveValue('recruiter');
  expect(form.querySelector('[name="visitor_name"]')).not.toBeInTheDocument();
  expect(screen.getByLabelText(/Company Name/i)).toHaveAttribute(
    'name',
    'company_name'
  );
  expect(screen.getByLabelText(/Contact Info \(Optional\)/i)).toHaveAttribute(
    'name',
    'contact_info'
  );
});

test('transmits FormData to Formspree and confirms success on the review page', async () => {
  window.fetch.mockResolvedValue({ ok: true });
  render(<GuestbookGate />);

  fireEvent.change(screen.getByLabelText(/01 \/\/ Name/i), {
    target: { value: 'Test Visitor' },
  });
  fireEvent.change(screen.getByLabelText(/Website Feedback/i), {
    target: { value: 'Add more architecture diagrams.' },
  });
  fireEvent.click(screen.getByRole('button', { name: /TRANSMIT DATA/i }));

  await waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(1));
  expect(await screen.findByText(/Thank you for the signal/i)).toBeInTheDocument();

  const [endpoint, request] = window.fetch.mock.calls[0];
  expect(endpoint).toBe(FORMSPREE_ENDPOINT);
  expect(request.method).toBe('POST');
  expect(request.headers).toEqual({ Accept: 'application/json' });
  expect(request.body).toBeInstanceOf(FormData);
  expect(request.body.get('_subject')).toBe(
    'New Website Visitor & Feedback!'
  );
  expect(request.body.get('visitor_type')).toBe('visitor');
  expect(request.body.get('visitor_name')).toBe('Test Visitor');
  expect(request.body.get('website_feedback')).toBe(
    'Add more architecture diagrams.'
  );
});

test('keeps the review form visible when Formspree rejects the transmission', async () => {
  window.fetch.mockResolvedValue({ ok: false });
  render(<GuestbookGate />);

  fireEvent.change(screen.getByLabelText(/01 \/\/ Name/i), {
    target: { value: 'Test Visitor' },
  });
  fireEvent.change(screen.getByLabelText(/Website Feedback/i), {
    target: { value: 'Test feedback' },
  });
  fireEvent.click(screen.getByRole('button', { name: /TRANSMIT DATA/i }));

  expect(await screen.findByText(/Transmission failed/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Return to portfolio/i })).toHaveAttribute(
    'href',
    '/'
  );
});

test('guards against duplicate synchronous submissions', () => {
  window.fetch.mockReturnValue(new Promise(() => {}));
  render(<GuestbookGate />);
  const form = document.querySelector('form');

  fireEvent.submit(form);
  fireEvent.submit(form);

  expect(window.fetch).toHaveBeenCalledTimes(1);
});

test('restores the previous document title when the review page closes', () => {
  document.title = 'Original Portfolio Title';
  const { unmount } = render(<GuestbookGate />);

  expect(document.title).toBe('Review Terminal — Surachet Panto');
  unmount();
  expect(document.title).toBe('Original Portfolio Title');
});
