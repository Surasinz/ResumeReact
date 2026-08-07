import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import GuestbookGate, {
  FORMSPREE_ENDPOINT,
  guestbookAction,
} from './GuestbookGate';
import { ROUTES } from './routes';

function renderReview() {
  const router = createMemoryRouter(
    [
      {
        path: ROUTES.review,
        Component: GuestbookGate,
        action: guestbookAction,
      },
    ],
    { initialEntries: [ROUTES.review] }
  );

  return render(<RouterProvider router={router} />);
}

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
  renderReview();
  const form = document.querySelector('form');

  expect(form).toHaveAttribute('action', ROUTES.review);
  expect(form).toHaveAttribute('method', 'post');
  expect(form).toHaveAttribute('data-formspree-endpoint', FORMSPREE_ENDPOINT);
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
  renderReview();

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
  renderReview();

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

test('disables transmission while the route action is pending', async () => {
  window.fetch.mockReturnValue(new Promise(() => {}));
  renderReview();

  fireEvent.change(screen.getByLabelText(/01 \/\/ Name/i), {
    target: { value: 'Test Visitor' },
  });
  fireEvent.change(screen.getByLabelText(/Website Feedback/i), {
    target: { value: 'Test feedback' },
  });
  fireEvent.click(screen.getByRole('button', { name: /TRANSMIT DATA/i }));

  expect(await screen.findByRole('button', { name: /TRANSMITTING/i })).toBeDisabled();
  expect(window.fetch).toHaveBeenCalledTimes(1);
});
