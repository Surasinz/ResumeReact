import ComponentDocsPage from '../ComponentDocsPage';
import RouteErrorBoundary from '../RouteErrorBoundary';
import RouteMeta from '../RouteMeta';

export function Component() {
  return (
    <>
      <RouteMeta title="Component Documentation" description="Interactive component documentation and design system for the Enterprise Builder portfolio." />
      <ComponentDocsPage />
    </>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
