import { render, screen, within } from '@testing-library/react';
import ViewSidebar from './ViewSidebar';

test('links to every portfolio view and exposes the current page', () => {
  render(<ViewSidebar currentPage="impact" />);
  const sidebar = screen.getByRole('complementary', {
    name: /Portfolio page navigation/i,
  });
  const navigation = within(sidebar).getByRole('navigation');

  expect(
    within(navigation).getByRole('link', { name: 'Review This Website' })
  ).toHaveAttribute('href', '/review');
  expect(
    within(navigation).getByRole('link', { name: 'Page Payload Not Found' })
  ).toHaveAttribute('href', '/404');
  expect(
    within(navigation).getByRole('link', { name: 'Impact Dashboard' })
  ).toHaveAttribute('href', '/impact');
  expect(
    within(navigation).getByRole('link', {
      name: 'Interactive Interview Terminal',
    })
  ).toHaveAttribute('href', '/interview-me');
  expect(
    within(navigation).getByRole('link', { name: 'Impact Dashboard' })
  ).toHaveAttribute('aria-current', 'page');
  expect(
    within(navigation).getByRole('link', { name: 'Page Payload Not Found' })
  ).not.toHaveAttribute('aria-current');
});
