'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/** True when the reader has asked the system for less motion. Motion then becomes an instant state change. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A number that ticks from where it was to `target` on the expo-out curve, the
 * way a tally is totted up. Reduced motion shows the target at once.
 */
export function useCountUp(target: number, { duration = 700, delay = 0 }: { duration?: number; delay?: number } = {}) {
  // Always 0 on the first render so server and client HTML agree; reduced motion lands on the target next frame
  const [value, setValue] = useState(0);
  const valueRef = useRef(value);

  useEffect(() => {
    const from = valueRef.current;
    const start = performance.now() + delay;
    let raf = 0;
    const step = (now: number) => {
      const t = prefersReducedMotion() ? 1 : Math.min(1, Math.max(0, (now - start) / duration));
      const eased = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const next = Math.round(from + (target - from) * eased);
      valueRef.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);

  return value;
}

/** A ticking number for sighted readers; screen readers get the final value only. */
export const CountUp: React.FC<{ value: number; duration?: number; delay?: number }> = ({ value, duration, delay }) => {
  const shown = useCountUp(value, { duration, delay });
  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{value}</span>
    </>
  );
};

/**
 * Holds a container's `.reveal-item` children on their first frame until the
 * container scrolls into view, then lets them ink in. Rows added later ink in as they arrive.
 */
export function useRevealOnView<T extends Element>() {
  return useCallback((node: T | null) => {
    if (!node) return;
    node.setAttribute('data-reveal', '');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.setAttribute('data-revealed', '');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
}

/** Inline start delay for a step in an authored sequence (read by the CSS as --d). */
export const motionDelay = (ms: number) => ({ '--d': `${Math.round(ms)}ms` }) as React.CSSProperties;
