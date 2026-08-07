import { useEffect, useRef, useState } from 'react';
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
  useNavigation,
} from 'react-router';
import Atmosphere from './Atmosphere';
import IntroGate, { hasSeenIntro, markIntroSeen } from './IntroGate';
import RouteErrorBoundary from './RouteErrorBoundary';
import { ThemeProvider, ThemeToggle, useTheme } from './ThemeSystem';
import { LanguageProvider, LanguageToggle } from './LanguageSystem';
import { ROUTES } from './routes';
import { Component as HomeRoute } from './routes/HomeRoute';
import './SiteRouter.css';

export function isHomePath(pathname) {
  return (pathname.replace(/\/+$/, '') || '/') === ROUTES.home;
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

function NavigationProgress() {
  const navigation = useNavigation();
  const isActive = navigation.state !== 'idle';

  return (
    <div
      className={`route-progress${isActive ? ' is-active' : ''}`}
      role="progressbar"
      aria-label="Loading page"
      aria-hidden={!isActive}
    />
  );
}

function RouteBootFallback() {
  return (
    <div className="route-boot" role="status" aria-label="Loading interface">
      INITIALIZING_INTERFACE
    </div>
  );
}

function RouterLayout() {
  const { pathname } = useLocation();
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
    <>
      {!showIntro && <ThemeToggle />}
      {!showIntro && <LanguageToggle />}
      <SiteCursorScope>
        <NavigationProgress />
        {showIntro ? (
          <IntroGate
            onEnter={() => {
              markIntroSeen();
              focusPortfolioRef.current = true;
              setIntroDone(true);
            }}
          />
        ) : (
          <Outlet />
        )}
        <ScrollRestoration />
      </SiteCursorScope>
    </>
  );
}

export const routeDefinitions = [
  {
    path: ROUTES.home,
    Component: RouterLayout,
    ErrorBoundary: RouteErrorBoundary,
    HydrateFallback: RouteBootFallback,
    children: [
      { index: true, Component: HomeRoute },
      { path: ROUTES.impact.slice(1), lazy: () => import('./routes/ImpactRoute') },
      { path: ROUTES.interview.slice(1), lazy: () => import('./routes/InterviewRoute') },
      { path: ROUTES.components.slice(1), lazy: () => import('./routes/ComponentsRoute') },
      { path: ROUTES.review.slice(1), lazy: () => import('./routes/ReviewRoute') },
      { path: ROUTES.notFound.slice(1), lazy: () => import('./routes/NotFoundRoute') },
      { path: '*', lazy: () => import('./routes/NotFoundRoute') },
    ],
  },
];

export function createSiteRouter() {
  return createBrowserRouter(routeDefinitions);
}

export default function SiteRouter() {
  const [router] = useState(createSiteRouter);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </ThemeProvider>
  );
}
