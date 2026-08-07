import { ImpactPage } from '../CyberPages';
import RouteErrorBoundary from '../RouteErrorBoundary';
import RouteMeta from '../RouteMeta';

export function Component() {
  return (
    <>
      <RouteMeta title="Impact Dashboard" description="Measured enterprise system, automation, database, and AI engineering outcomes by Surachet Panto." />
      <ImpactPage />
    </>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
