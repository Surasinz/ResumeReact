import { Link, useInRouterContext } from 'react-router';

/**
 * Uses client-side navigation inside the app and remains renderable in
 * isolated component previews/tests that do not mount a router.
 */
export default function InternalLink({ href, children, ...props }) {
  const isInsideRouter = useInRouterContext();

  if (!isInsideRouter) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} {...props}>
      {children}
    </Link>
  );
}
