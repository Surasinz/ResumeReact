import { isRouteErrorResponse, useRouteError } from 'react-router';
import InternalLink from './InternalLink';
import RouteMeta from './RouteMeta';
import { ROUTES } from './routes';
import './RouteErrorBoundary.css';

export default function RouteErrorBoundary() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const message = isRouteErrorResponse(error)
    ? error.statusText || 'The requested interface could not be loaded.'
    : 'A route module failed to initialize. The rest of the portfolio is still available.';

  return (
    <main className="route-error" role="alert">
      <RouteMeta
        title={`${status} Route Error`}
        description="Portfolio route recovery screen."
      />
      <p>ROUTER_EXCEPTION // {status}</p>
      <h1>Interface interrupted.</h1>
      <pre>{message}</pre>
      <InternalLink href={ROUTES.home}>[ RETURN TO PORTFOLIO ]</InternalLink>
    </main>
  );
}
