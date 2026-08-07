import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import RouteErrorBoundary from './RouteErrorBoundary';

test('contains a route crash and keeps a recovery link available', async () => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        loader: () => {
          throw new Error('Simulated route failure');
        },
        Component: () => <div>UNREACHABLE</div>,
        HydrateFallback: () => null,
        ErrorBoundary: RouteErrorBoundary,
      },
    ],
    { initialEntries: ['/'] }
  );

  render(<RouterProvider router={router} />);

  expect(await screen.findByRole('alert')).toHaveTextContent('Interface interrupted');
  expect(screen.getByRole('link', { name: /RETURN TO PORTFOLIO/i })).toHaveAttribute(
    'href',
    '/'
  );
  expect(screen.queryByText('UNREACHABLE')).not.toBeInTheDocument();
});
