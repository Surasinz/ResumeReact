import App from './App';
import ComponentDocsPage from './ComponentDocsPage';
import { ImpactPage, InterviewPage } from './CyberPages';
import GuestbookGate from './GuestbookGate';
import NotFoundPage from './NotFoundPage';
import { ThemeProvider, ThemeToggle } from './ThemeSystem';
import {
  LanguageProvider,
  LanguageToggle,
} from './LanguageSystem';

export function resolvePage(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/impact') return <ImpactPage />;
  if (normalizedPath === '/interview-me') return <InterviewPage />;
  if (normalizedPath === '/components') return <ComponentDocsPage />;
  if (normalizedPath === '/review') return <GuestbookGate />;
  if (normalizedPath === '/') return <App />;
  return <NotFoundPage />;
}

export default function SiteRouter() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ThemeToggle />
        <LanguageToggle />
        <div className="language-content" lang="en">
          {resolvePage(window.location.pathname)}
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
