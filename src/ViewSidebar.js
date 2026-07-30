import './ViewSidebar.css';
import { LocalizedText, useLanguage } from './LanguageSystem';

const sidebarLinks = [
  {
    id: 'review',
    href: '/review',
    code: 'REV',
    labelKey: 'sidebar_review',
  },
  {
    id: 'not-found',
    href: '/404',
    code: '404',
    labelKey: 'sidebar_404',
  },
  {
    id: 'impact',
    href: '/impact',
    code: 'IMP',
    labelKey: 'sidebar_impact',
  },
  {
    id: 'interview',
    href: '/interview-me',
    code: 'Q&A',
    labelKey: 'sidebar_interview',
  },
  {
    id: 'components',
    href: '/components',
    code: 'UI',
    labelKey: 'sidebar_components',
  },
];

export default function ViewSidebar({ currentPage }) {
  const { language, t } = useLanguage();

  return (
    <aside className="view-sidebar" aria-label="Portfolio page navigation">
      <div className="view-sidebar-title" aria-hidden="true">
        <span>SYS</span>
        <LocalizedText as="b" i18nKey="sidebar_explore" />
      </div>
      <nav>
        {sidebarLinks.map((item) => {
          const isCurrent = currentPage === item.id;

          return (
            <a
              className={isCurrent ? 'is-current' : ''}
              href={item.href}
              key={item.id}
              aria-current={isCurrent ? 'page' : undefined}
              aria-label={t(item.labelKey)}
              title={t(item.labelKey)}
              lang={language}
            >
              <span className="view-sidebar-code" aria-hidden="true">
                {item.code}
              </span>
              <span className="view-sidebar-label" aria-hidden="true">
                <LocalizedText i18nKey={item.labelKey} />
              </span>
            </a>
          );
        })}
      </nav>
      <span className="view-sidebar-status" aria-hidden="true">
        ONLINE
      </span>
    </aside>
  );
}

export { sidebarLinks };
