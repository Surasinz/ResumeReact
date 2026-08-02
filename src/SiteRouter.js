import { useState } from 'react';
import App from './App';
import Atmosphere from './Atmosphere';
import ComponentDocsPage from './ComponentDocsPage';
import IntroGate, { hasSeenIntro, markIntroSeen } from './IntroGate';
import { ImpactPage, InterviewPage } from './CyberPages';
import GuestbookGate from './GuestbookGate';
import NotFoundPage from './NotFoundPage';
import { ThemeProvider, ThemeToggle, useTheme } from './ThemeSystem';
import {
  LanguageProvider,
  LanguageToggle,
} from './LanguageSystem';

export function isHomePath(pathname) {
  return (pathname.replace(/\/+$/, '') || '/') === '/';
}

export function resolvePage(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/impact') return <ImpactPage />;
  if (normalizedPath === '/interview-me') return <InterviewPage />;
  if (normalizedPath === '/components') return <ComponentDocsPage />;
  if (normalizedPath === '/review') return <GuestbookGate />;
  if (normalizedPath === '/') return <App />;
  return <NotFoundPage />;
}

/*
  The intro only fronts the home page, and only once per browser session.
  Deep links to /impact or /components are never interrupted, and coming back
  to the portfolio from one of them does not replay the sequence -- the
  visitor already watched it.
*/
function HomeWithIntro() {
  const [introDone, setIntroDone] = useState(hasSeenIntro);

  if (introDone) return <App />;

  return (
    <IntroGate
      onEnter={() => {
        markIntroSeen();
        setIntroDone(true);
      }}
    />
  );
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
      <Atmosphere />
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
          {isHomePath(window.location.pathname) ? (
            <HomeWithIntro />
          ) : (
            resolvePage(window.location.pathname)
          )}
        </SiteCursorScope>
      </LanguageProvider>
    </ThemeProvider>
  );
}
