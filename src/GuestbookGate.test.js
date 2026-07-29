import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

test('renders the Formspree form and switches visitor-specific fields', () => {
  render(<GuestbookGate onEnter={jest.fn()} />);
  const form = document.querySelector('form');

  expect(form).toHaveAttribute('action', FORMSPREE_ENDPOINT);
  expect(form).toHaveAttribute('method', 'POST');
  expect(
    form.querySelector('input[name="_subject"]')
  ).toHaveValue('New Website Visitor & Feedback!');
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

test('transmits FormData to Formspree and grants access after success', async () => {
  const onEnter = jest.fn();
  window.fetch.mockResolvedValue({ ok: true });
  render(<GuestbookGate onEnter={onEnter} />);

  fireEvent.change(screen.getByLabelText(/01 \/\/ Name/i), {
    target: { value: 'Test Visitor' },
  });
  fireEvent.change(screen.getByLabelText(/Website Feedback/i), {
    target: { value: 'Add more architecture diagrams.' },
  });
  fireEvent.click(screen.getByRole('button', { name: /TRANSMIT DATA/i }));

  await waitFor(() => {
    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

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

test('keeps the gate open when Formspree rejects the transmission', async () => {
  const onEnter = jest.fn();
  window.fetch.mockResolvedValue({ ok: false });
  render(<GuestbookGate onEnter={onEnter} />);

  fireEvent.change(screen.getByLabelText(/01 \/\/ Name/i), {
    target: { value: 'Test Visitor' },
  });
  fireEvent.change(screen.getByLabelText(/Website Feedback/i), {
    target: { value: 'Test feedback' },
  });
  fireEvent.click(screen.getByRole('button', { name: /TRANSMIT DATA/i }));

  expect(
    await screen.findByText(/Transmission failed/i)
  ).toBeInTheDocument();
  expect(onEnter).not.toHaveBeenCalled();
});

test('allows privacy-conscious visitors to continue without a request', () => {
  const onEnter = jest.fn();
  render(<GuestbookGate onEnter={onEnter} />);

  fireEvent.click(
    screen.getByRole('button', { name: /Continue without transmitting/i })
  );

  expect(onEnter).toHaveBeenCalledTimes(1);
  expect(window.fetch).not.toHaveBeenCalled();
});

test('guards against duplicate synchronous submissions', () => {
  window.fetch.mockReturnValue(new Promise(() => {}));
  render(<GuestbookGate onEnter={jest.fn()} />);
  const form = document.querySelector('form');

  fireEvent.submit(form);
  fireEvent.submit(form);

  expect(window.fetch).toHaveBeenCalledTimes(1);
});

test('aborts an active transmission and grants access only once when skipped', async () => {
  let resolveRequest;
  const onEnter = jest.fn();
  window.fetch.mockReturnValue(
    new Promise((resolve) => {
      resolveRequest = resolve;
    })
  );
  render(<GuestbookGate onEnter={onEnter} />);
  const form = document.querySelector('form');

  fireEvent.submit(form);
  const request = window.fetch.mock.calls[0][1];
  fireEvent.click(
    screen.getByRole('button', { name: /Cancel transmission and continue/i })
  );

  expect(request.signal.aborted).toBe(true);
  expect(onEnter).toHaveBeenCalledTimes(1);

  await act(async () => {
    resolveRequest({ ok: true });
  });
  expect(onEnter).toHaveBeenCalledTimes(1);
});

test('restores the previous document title when the gate closes', () => {
  document.title = 'Original Portfolio Title';
  const { unmount } = render(<GuestbookGate onEnter={jest.fn()} />);

  expect(document.title).toBe('Guestbook Gateway — Surachet Panto');
  unmount();
  expect(document.title).toBe('Original Portfolio Title');
});
