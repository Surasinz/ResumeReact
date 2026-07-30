import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import './LanguageSystem.css';
import { translations } from './translations';

export const LANGUAGE_STORAGE_KEY = 'surachet-portfolio-language';
export { translations };

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => translations.en[key] ?? key,
});

const technicalTerms = [
  'CUTOFF_FOR_EBOOK_DATE',
  'Enterprise Applications',
  'Enterprise Interfaces',
  'Interactive Interview Terminal',
  'Motorcycle Helmet Compliance Detection System',
  'Automated Notification Scripts',
  'Oracle APEX Interactive Grids',
  'Google Apps Script',
  'Python Virtual Environments',
  'Workflow Automation',
  'Database Optimization',
  'Secure Data Pipelines',
  'Software Engineer',
  'Trainee Software Engineer',
  'Part Time Software Engineer',
  'Computer Vision',
  'Business Impact',
  'System Bottlenecks',
  'Production-ready Code',
  'Technical Skills',
  'Programming Languages',
  'Technologies',
  'Frameworks',
  'Frontend',
  'Backend',
  'Database',
  'Queries',
  'Query',
  'Server',
  'Software',
  'Application',
  'Applications',
  'API',
  'APIs',
  'UI',
  'AI',
  'Component',
  'Components',
  'Framework',
  'Deploy',
  'Automation',
  'Interface',
  'Interfaces',
  'Payload',
  'Prompt',
  'Prompts',
  'Code',
  'Form',
  'Input',
  'Inputs',
  'Label',
  'Labels',
  'Cursor',
  'Pointer',
  'Layer',
  'Layers',
  'Reveal',
  'Mask',
  'Fade',
  'Build',
  'Portfolio',
  'Feedback',
  'Email',
  'LinkedIn',
  'GPA',
  'Java',
  'JavaScript',
  'TypeScript',
  'React',
  'SQL',
  'PL/SQL',
  'Oracle APEX',
  'Cypress',
  'MySQL',
  'JSON',
  'Database Triggers',
  'Secure Token Architecture',
  'Data Pipeline',
  'Data Flow',
  'Date Cutoffs',
  'Calendar Events',
  'Parameters',
  'Real-time',
  'Zero-delay',
  'QuantAgent',
  'Execution Policy',
  'Gemini API',
  'LangChain',
  'Market Insights',
  'LLM',
  'Cross-channel Sync',
  'Manual Reboot',
  'Page Payload',
  'Directory',
  'SYSTEM_LOG',
  'ACTION',
  'WARNING',
  'Cyberpunk',
  'Monospace',
  'Neon Focus States',
  'Neon Focus Borders',
  'Interactive Patterns',
  'Profile Image',
  'Frame',
  'Radial CSS Mask',
  'Preview Mode',
];

const escapedTechnicalTerms = technicalTerms
  .sort((left, right) => right.length - left.length)
  .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const technicalTermPattern = new RegExp(
  `(^|[^A-Za-z0-9])(${escapedTechnicalTerms.join('|')})(?![A-Za-z0-9])`,
  'gi'
);

function renderTranslation(value, language) {
  if (language !== 'th' || typeof value !== 'string') return value;

  const parts = [];
  let lastIndex = 0;
  let match;
  technicalTermPattern.lastIndex = 0;

  while ((match = technicalTermPattern.exec(value)) !== null) {
    const term = match[2];
    const termStart = match.index + match[1].length;

    if (termStart > lastIndex) {
      parts.push(value.slice(lastIndex, termStart));
    }
    parts.push(
      <span lang="en" key={`${termStart}-${term}`}>
        {term}
      </span>
    );
    lastIndex = termStart + term.length;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts;
}

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

export function LocalizedText({
  as: Element = 'span',
  i18nKey,
  children,
  ...props
}) {
  const { language, t } = useLanguage();
  const value = i18nKey ? t(i18nKey) : children;

  return (
    <Element
      {...props}
      data-i18n={i18nKey || undefined}
      lang={language}
    >
      {renderTranslation(value, language)}
    </Element>
  );
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
