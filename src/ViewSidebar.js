import './ViewSidebar.css';

const sidebarLinks = [
  {
    id: 'review',
    href: '/review',
    code: 'REV',
    label: 'Review This Website',
  },
  {
    id: 'not-found',
    href: '/404',
    code: '404',
    label: 'Page Payload Not Found',
  },
  {
    id: 'impact',
    href: '/impact',
    code: 'IMP',
    label: 'Impact Dashboard',
  },
  {
    id: 'interview',
    href: '/interview-me',
    code: 'Q&A',
    label: 'Interactive Interview Terminal',
  },
];

export default function ViewSidebar({ currentPage }) {
  return (
    <aside className="view-sidebar" aria-label="Portfolio page navigation">
      <div className="view-sidebar-title" aria-hidden="true">
        <span>SYS</span>
        <b>Explore views</b>
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
              aria-label={item.label}
              title={item.label}
            >
              <span className="view-sidebar-code" aria-hidden="true">
                {item.code}
              </span>
              <span className="view-sidebar-label" aria-hidden="true">
                {item.label}
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
