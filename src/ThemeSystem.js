import {
  createContext,
  useContext,
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

function readInitialTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
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

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The theme still works when storage is blocked by the browser.
    }
  }, [theme]);

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
