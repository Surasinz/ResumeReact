import { PUBLIC_ROUTE_PATHS, ROUTES } from './routes';
import { routeDefinitions } from './SiteRouter';
import { sidebarLinks } from './ViewSidebar';

test('public route constants are unique absolute URL contracts', () => {
  expect(new Set(PUBLIC_ROUTE_PATHS).size).toBe(PUBLIC_ROUTE_PATHS.length);
  PUBLIC_ROUTE_PATHS.forEach((path) => expect(path).toMatch(/^\/(?:[^/].*)?$/));
});

test('data router and sidebar consume the shared route contract', () => {
  const childPaths = routeDefinitions[0].children
    .filter((route) => route.path && route.path !== '*')
    .map((route) => `/${route.path}`);

  expect(childPaths).toEqual(
    expect.arrayContaining(PUBLIC_ROUTE_PATHS.filter((path) => path !== ROUTES.home))
  );
  expect(sidebarLinks.map((item) => item.href)).toEqual([
    ROUTES.review,
    ROUTES.notFound,
    ROUTES.impact,
    ROUTES.interview,
    ROUTES.components,
  ]);
});
