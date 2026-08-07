import { InterviewPage } from '../CyberPages';
import RouteErrorBoundary from '../RouteErrorBoundary';
import RouteMeta from '../RouteMeta';

export function Component() {
  return (
    <>
      <RouteMeta title="Interview Terminal" description="Interactive interview terminal covering Surachet Panto's engineering strengths and approach." />
      <InterviewPage />
    </>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
