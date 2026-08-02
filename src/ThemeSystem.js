import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import './ThemeSystem.css';

export const THEME_STORAGE_KEY = 'surachet-portfolio-theme';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

function hasStoredThemePreference() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' || stored === 'light';
  } catch {
    return false;
  }
}

function readInitialTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Fall through to the system preference when storage is unavailable.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    ? 'dark'
    : 'light';
}

function updateFavicon(theme) {
  const link = document.getElementById('dynamic-favicon');
  if (!link) return;

  link.href = `${process.env.PUBLIC_URL}/${
    theme === 'dark' ? 'favicon-dark.png' : 'favicon-light.png'
  }`;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useLayoutEffect(() => {
    document.body.dataset.theme = theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0a0a0f' : '#ffffff');
    updateFavicon(theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The theme still works when storage is blocked by the browser.
    }
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return undefined;

    const handleChange = (event) => {
      // Once the visitor has picked a theme explicitly (via the toggle),
      // that choice wins — the OS preference only drives the theme (and
      // therefore the favicon) before any manual choice has been saved.
      if (hasStoredThemePreference()) return;
      setTheme(event.matches ? 'dark' : 'light');
    };

    media.addEventListener?.('change', handleChange);
    media.addListener?.(handleChange);
    return () => {
      media.removeEventListener?.('change', handleChange);
      media.removeListener?.(handleChange);
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === 'light' ? 'dark' : 'light'
        ),
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className="theme-switch"
      type="button"
      role="switch"
      lang="en"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
    >
      <span className="theme-switch__base" aria-hidden="true">
        <span className="theme-switch__mode theme-switch__mode--light">
          LIGHT
        </span>
        <span className="theme-switch__mode theme-switch__mode--dark">
          DARK
        </span>
        <span className="theme-switch__indicator">
          <span className="theme-switch__icon">{isDark ? '◐' : '☼'}</span>
          <span>{isDark ? 'DARK' : 'LIGHT'}</span>
        </span>
      </span>
    </button>
  );
}
