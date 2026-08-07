import NotFoundPage from '../NotFoundPage';
import RouteErrorBoundary from '../RouteErrorBoundary';
import RouteMeta from '../RouteMeta';

export function Component() {
  return (
    <>
      <RouteMeta title="404 — Page Payload Not Found" description="The requested portfolio page could not be found." />
      <NotFoundPage />
    </>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
