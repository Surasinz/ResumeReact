import { useState } from 'react';
import App from './App';
import { ImpactPage, InterviewPage } from './CyberPages';
import GuestbookGate from './GuestbookGate';
import NotFoundPage from './NotFoundPage';

export const GUESTBOOK_ACCESS_KEY = 'surachet-guestbook-access';

function hasGuestbookAccess() {
  try {
    return window.sessionStorage.getItem(GUESTBOOK_ACCESS_KEY) === 'granted';
  } catch {
    return false;
  }
}

export function resolvePage(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/impact') return <ImpactPage />;
  if (normalizedPath === '/interview-me') return <InterviewPage />;
  if (normalizedPath === '/') return <App />;
  return <NotFoundPage />;
}

export default function SiteRouter() {
  const [hasAccess, setHasAccess] = useState(hasGuestbookAccess);

  const grantAccess = () => {
    try {
      window.sessionStorage.setItem(GUESTBOOK_ACCESS_KEY, 'granted');
    } catch {
      // The current view still unlocks when session storage is unavailable.
    }

    setHasAccess(true);
  };

  if (!hasAccess) {
    return <GuestbookGate onEnter={grantAccess} />;
  }

  return resolvePage(window.location.pathname);
}
