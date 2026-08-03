import { useEffect, useRef, useState } from 'react';
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
  const pathname = window.location.pathname;
  /*
    The intro only fronts the home page, and only once per browser session.
    Deep links to /impact or /components are never interrupted, and coming
    back to the portfolio from one of them does not replay it -- the visitor
    already watched it.
  */
  const [introDone, setIntroDone] = useState(
    () => !isHomePath(pathname) || hasSeenIntro()
  );
  const focusPortfolioRef = useRef(false);
  const showIntro = isHomePath(pathname) && !introDone;

  useEffect(() => {
    if (!introDone || !focusPortfolioRef.current) return;
    document.getElementById('portfolio-main')?.focus({ preventScroll: true });
    focusPortfolioRef.current = false;
  }, [introDone]);

  return (
    <ThemeProvider>
      <LanguageProvider>
        {/*
          Held back until the visitor is through. The intro is a single
          composed shot, and floating switches over it break that -- they
          belong to the portfolio, so they arrive with it.
        */}
        {!showIntro && <ThemeToggle />}
        {!showIntro && <LanguageToggle />}
        <SiteCursorScope>
          {showIntro ? (
            <IntroGate
              onEnter={() => {
                markIntroSeen();
                focusPortfolioRef.current = true;
                setIntroDone(true);
              }}
            />
          ) : (
            resolvePage(pathname)
          )}
        </SiteCursorScope>
      </LanguageProvider>
    </ThemeProvider>
  );
}
