import App from './App';
import ComponentDocsPage from './ComponentDocsPage';
import { ImpactPage, InterviewPage } from './CyberPages';
import GuestbookGate from './GuestbookGate';
import NotFoundPage from './NotFoundPage';
import { ThemeProvider, ThemeToggle, useTheme } from './ThemeSystem';
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

function SiteCursorScope({ children }) {
  const { theme } = useTheme();

  return (
    <div
      className="language-content"
      lang="en"
      style={{
        '--cursor-default': `url("${process.env.PUBLIC_URL}/${theme === 'dark' ? 'cursor-dark.png' : 'cursor.png'}") 3 3, auto`,
        '--cursor-hand': `url("${process.env.PUBLIC_URL}/${theme === 'dark' ? 'hand-dark.png' : 'hand.png'}") 4 4, pointer`,
      }}
    >
      {children}
    </div>
  );
}

export default function SiteRouter() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ThemeToggle />
        <LanguageToggle />
        <SiteCursorScope>
          {resolvePage(window.location.pathname)}
        </SiteCursorScope>
      </LanguageProvider>
    </ThemeProvider>
  );
}
