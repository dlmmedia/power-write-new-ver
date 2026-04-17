'use client';

/**
 * ScrollProgress — thin gradient bar pinned to the very top of the
 * viewport that tracks document scroll progress (0 → 100%).
 *
 * Implementation notes:
 *  - `useScroll({ container })` watches the body; `useSpring` smooths
 *    the raw 0→1 motion value so the bar feels physical rather than
 *    glued to the wheel ticks.
 *  - Suppressed under `prefers-reduced-motion` (the bar is decorative,
 *    not a primary navigation cue).
 *  - z-index sits above the sticky header so it's never clipped.
 *  - Pure transform-driven width via `scaleX` keeps it on the
 *    compositor — zero layout work per scroll frame.
 */

import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left"
      style={{
        scaleX,
        background:
          'linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 50%, var(--accent-3) 100%)',
        boxShadow: '0 0 12px 0 var(--accent)',
      }}
    />
  );
}
