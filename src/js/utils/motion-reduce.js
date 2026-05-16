/**
 * motion-reduce.js — runtime check for prefers-reduced-motion.
 * Controllers that orchestrate motion JS-side (CountUp, confetti,
 * autoplay carousel) call this on connect() to opt out.
 */

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
