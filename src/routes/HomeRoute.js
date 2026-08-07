import App from '../App';
import RouteErrorBoundary from '../RouteErrorBoundary';
import RouteMeta from '../RouteMeta';

export function Component() {
  return (
    <>
      <RouteMeta description="Portfolio and resume of Surachet Panto, a Software Engineer specializing in enterprise applications." />
      <App />
    </>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
