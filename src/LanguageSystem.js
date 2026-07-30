import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import './LanguageSystem.css';

export const LANGUAGE_STORAGE_KEY = 'surachet-portfolio-language';

// Add new copy here, using the same key in both languages.
// Technical terms intentionally remain in English in the Thai translations.
export const translations = {
  en: {
    nav_about: 'About',
    nav_experience: 'Experience',
    nav_projects: 'Projects',
    hero_greeting: "Hi, I'm",
    hero_subtitle: 'Software Engineer specializing in enterprise applications',
    view_projects: 'View Projects',
    contact_btn: 'Contact Me',
    impact_metric: 'Reduced Processing Time',
  },
  th: {
    nav_about: 'เกี่ยวกับผม',
    nav_experience: 'ประสบการณ์',
    nav_projects: 'โปรเจกต์',
    hero_greeting: 'สวัสดี ผมคือ',
    hero_subtitle: 'Software Engineer ที่เชี่ยวชาญด้าน Enterprise Applications',
    view_projects: 'ดูโปรเจกต์',
    contact_btn: 'ติดต่อผม',
    impact_metric: 'ลดเวลาในการประมวลผล',
  },
};

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => translations.en[key] ?? key,
});

function readInitialLanguage() {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'th'
      ? 'th'
      : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readInitialLanguage);

  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.body.dataset.language = language;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Language switching remains available when browser storage is blocked.
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage) => {
        if (nextLanguage === 'en' || nextLanguage === 'th') {
          setLanguageState(nextLanguage);
        }
      },
      t: (key) =>
        translations[language]?.[key] ?? translations.en[key] ?? key,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="language-switch"
      role="group"
      aria-label="Select website language"
      lang="en"
    >
      {['en', 'th'].map((option) => {
        const isActive = language === option;
        const label = option.toUpperCase();

        return (
          <button
            type="button"
            key={option}
            className={isActive ? 'is-active' : ''}
            aria-pressed={isActive}
            aria-label={`Use ${option === 'en' ? 'English' : 'Thai'}`}
            onClick={() => setLanguage(option)}
          >
            {label}
          </button>
        );
      })}
      <span
        className="language-switch__indicator"
        data-language={language}
        aria-hidden="true"
      />
    </div>
  );
}
