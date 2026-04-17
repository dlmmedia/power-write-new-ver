'use client';

/**
 * Scroll-triggered reveal primitives for marketing surfaces.
 *
 * Why a tiny wrapper instead of using framer-motion props inline everywhere?
 *  - One place to enforce the project's motion language (distance, duration,
 *    easing, stagger cadence) so every section animates with the same feel.
 *  - One place to honour `prefers-reduced-motion` — when the user opts out,
 *    these components render their children with no transform/opacity at all,
 *    so the page is instantly visible.
 *  - Zero layout shift: we animate transform + opacity only.
 *
 * Usage:
 *   <Reveal>...</Reveal>                  // single element fade-up
 *   <RevealStagger>                       // parent that staggers its children
 *     <RevealItem>...</RevealItem>
 *     <RevealItem>...</RevealItem>
 *   </RevealStagger>
 */

import { motion, useReducedMotion, type Variants, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const; // "ease out expo"-ish, gentle finish
const DURATION = 0.55;
const DISTANCE = 16;
const STAGGER = 0.06;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: DISTANCE },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
};

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: STAGGER, delayChildren: 0.04 },
  },
};

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'variants' | 'initial' | 'whileInView'> {
  children: ReactNode;
  /** Delay (seconds) before the element starts animating. */
  delay?: number;
  /** Override Y distance for unique cases (e.g. heroes). */
  distance?: number;
  /** Render once and stop — true is right for marketing pages. */
  once?: boolean;
  /** Extra viewport margin. Negative pulls trigger earlier. */
  margin?: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'article' | 'aside' | 'ul' | 'li' | 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function Reveal({
  children,
  delay = 0,
  distance,
  once = true,
  margin = '-80px',
  as = 'div',
  ...rest
}: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;

  if (reduce) {
    return <Tag {...rest}>{children}</Tag>;
  }

  return (
    <Tag
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin }}
      variants={
        distance !== undefined
          ? {
              hidden: { opacity: 0, y: distance },
              show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE, delay } },
            }
          : {
              ...fadeUp,
              show: { ...fadeUp.show, transition: { duration: DURATION, ease: EASE, delay } },
            }
      }
      {...rest}
    >
      {children}
    </Tag>
  );
}

interface RevealStaggerProps extends Omit<HTMLMotionProps<'div'>, 'variants' | 'initial' | 'whileInView'> {
  children: ReactNode;
  once?: boolean;
  margin?: string;
  /** Stagger between children (seconds). */
  stagger?: number;
  /** Initial delay before the first child animates (seconds). */
  delay?: number;
  as?: 'div' | 'section' | 'ul' | 'ol';
}

export function RevealStagger({
  children,
  once = true,
  margin = '-80px',
  stagger = STAGGER,
  delay = 0,
  as = 'div',
  ...rest
}: RevealStaggerProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;

  if (reduce) {
    return <Tag {...rest}>{children}</Tag>;
  }

  return (
    <Tag
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin }}
      variants={{
        ...container,
        show: { transition: { staggerChildren: stagger, delayChildren: 0.04 + delay } },
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

interface RevealItemProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  children: ReactNode;
  as?: 'div' | 'li' | 'article' | 'section';
}

export function RevealItem({ children, as = 'div', ...rest }: RevealItemProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;

  if (reduce) {
    return <Tag {...rest}>{children}</Tag>;
  }

  return (
    <Tag variants={fadeUp} {...rest}>
      {children}
    </Tag>
  );
}
