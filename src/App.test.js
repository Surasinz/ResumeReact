import { render, screen, within } from '@testing-library/react';
import App from './App';

test('renders the portfolio headline and primary navigation', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Hi, I'm Surachet Panto/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /View Projects/i })).toHaveAttribute('href', '#projects');
  expect(screen.getByRole('link', { name: /Contact Me/i })).toHaveAttribute('href', '#contact');
  expect(screen.getByRole('link', { name: /Experience/i })).toHaveAttribute('href', '#experience');
  expect(screen.getByRole('link', { name: /surachetpan@hotmail.com/i })).toHaveAttribute(
    'href',
    'mailto:surachetpan@hotmail.com'
  );
  expect(screen.getByRole('link', { name: /\(\+66\) 88 282 2749/i })).toHaveAttribute(
    'href',
    'tel:+66882822749'
  );
  expect(screen.getAllByRole('link', { name: /LinkedIn/i })[0]).toHaveAttribute(
    'href',
    'https://linkedin.com/in/surachet-panto'
  );
  expect(screen.getAllByRole('link', { name: /GitHub/i })[0]).toHaveAttribute(
    'href',
    'https://github.com/Surasinz'
  );
});

test('keeps section navigation available at a narrow viewport', () => {
  window.innerWidth = 375;
  window.dispatchEvent(new Event('resize'));
  render(<App />);

  const navigation = screen.getByRole('navigation', { name: /Main navigation/i });
  expect(navigation).toBeInTheDocument();
  expect(within(navigation).getByRole('link', { name: /About/i })).toHaveAttribute('href', '#about');
  expect(within(navigation).getByRole('link', { name: /Projects/i })).toHaveAttribute(
    'href',
    '#projects'
  );
});
