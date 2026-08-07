import GuestbookGate, { guestbookAction } from '../GuestbookGate';
import RouteErrorBoundary from '../RouteErrorBoundary';
import RouteMeta from '../RouteMeta';

export const action = guestbookAction;

export function Component() {
  return (
    <>
      <RouteMeta title="Review Terminal" description="Send portfolio feedback or a recruiter message to Surachet Panto." />
      <GuestbookGate />
    </>
  );
}

export { RouteErrorBoundary as ErrorBoundary };
