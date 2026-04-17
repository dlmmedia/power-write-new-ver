'use client';

/**
 * MiniLiveText — small auto-looping streamer used inside the bento
 * "AI Writing" tile. Streams `text` once on mount, holds for `holdMs`,
 * then resets and streams again. Honours `prefers-reduced-motion`.
 *
 * Kept intentionally minimal — the hero already has `LiveWritingDemo`
 * for the full-blown experience; this one is a "feature card sized"
 * version that gives the tile life without re-implementing the whole
 * book-spread UI.
 */

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface MiniLiveTextProps {
  text: string;
  speed?: number;
  holdMs?: number;
  startDelayMs?: number;
  className?: string;
  caretClassName?: string;
}

export function MiniLiveText({
  text,
  speed = 32,
  holdMs = 2400,
  startDelayMs = 400,
  className = '',
  caretClassName = 'inline-block w-[2px] h-[0.95em] align-text-bottom ml-[1px] bg-[var(--accent)] animate-caret',
}: MiniLiveTextProps) {
  const reduce = useReducedMotion();
  const [streamed, setStreamed] = useState('');
  const [cycle, setCycle] = useState(0);

  // Reduced motion → derive the final string at render time. Streaming
  // case → use the buffered `streamed` state. This split lets the effect
  // below only ever call setState from inside async callbacks, avoiding
  // the cascading-renders trap (`react-hooks/set-state-in-effect`).
  const displayed = reduce ? text : streamed;

  useEffect(() => {
    if (reduce) return;

    let mounted = true;
    let i = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let restartId: number | null = null;

    // The reset + streaming both fire on the next tick — never
    // synchronously in the effect body.
    const startId = window.setTimeout(() => {
      if (!mounted) return;
      setStreamed('');
      intervalId = setInterval(() => {
        if (!mounted) return;
        i += 1;
        if (i > text.length) {
          if (intervalId) clearInterval(intervalId);
          restartId = window.setTimeout(() => {
            if (mounted) setCycle((c) => c + 1);
          }, holdMs);
          return;
        }
        setStreamed(text.slice(0, i));
      }, speed);
    }, startDelayMs);

    return () => {
      mounted = false;
      window.clearTimeout(startId);
      if (intervalId) clearInterval(intervalId);
      if (restartId !== null) window.clearTimeout(restartId);
    };
  }, [text, speed, holdMs, startDelayMs, reduce, cycle]);

  const isStreaming = displayed.length < text.length;

  return (
    <p className={className}>
      {displayed}
      {isStreaming && <span aria-hidden="true" className={caretClassName} />}
    </p>
  );
}
