import App from './App';
import { ImpactPage, InterviewPage } from './CyberPages';
import GuestbookGate from './GuestbookGate';
import NotFoundPage from './NotFoundPage';

export function resolvePage(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/impact') return <ImpactPage />;
  if (normalizedPath === '/interview-me') return <InterviewPage />;
  if (normalizedPath === '/review') return <GuestbookGate />;
  if (normalizedPath === '/') return <App />;
  return <NotFoundPage />;
}

export default function SiteRouter() {
  return resolvePage(window.location.pathname);
}
