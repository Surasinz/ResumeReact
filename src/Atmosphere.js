import { useEffect, useRef } from 'react';
import './Atmosphere.css';

/*
  A fixed film-grain plate over the whole page. Flat digital colour is what
  makes a layout read as "cheap"; a little animated noise puts texture back
  into the large empty areas this design leans on.
*/
export function GrainOverlay() {
  return <div className="grain-overlay" aria-hidden="true" />;
}

/*
  Reading progress as a hairline across the top. Driven through a CSS custom
  property so the browser only ever recomputes a transform.
*/
export function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;

    let frame = null;
    // Tracked separately from the frame handle: `frame = rAF(update)` only
    // assigns after update() has run, so a callback that clears the handle
    // itself would be overwritten and the scheduler would latch forever.
    let pending = false;

    const update = () => {
      pending = false;
      const root = document.documentElement;
      const scrollable = root.scrollHeight - root.clientHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.setProperty(
        '--scroll-progress',
        Math.min(Math.max(progress, 0), 1).toFixed(4)
      );
    };

    const schedule = () => {
      if (pending) return;
      pending = true;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="scroll-progress" ref={barRef} aria-hidden="true" />;
}

export default function Atmosphere() {
  return (
    <>
      <ScrollProgress />
      <GrainOverlay />
    </>
  );
}
