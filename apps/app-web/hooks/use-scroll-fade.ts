'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export type ScrollFade = 'none' | 'start' | 'end' | 'both';

/**
 * Tracks a horizontal scroller so the edge fade shows only where more content
 * exists (design/system/components-states.md#scrollers). Returns the element
 * ref and the current fade.
 */
export function useScrollFade<Element extends HTMLElement>(): [
  RefObject<Element | null>,
  ScrollFade,
] {
  const ref = useRef<Element>(null);
  const [fade, setFade] = useState<ScrollFade>('none');

  const update = useCallback(() => {
    const element = ref.current;

    if (!element) return;

    const maxScroll = element.scrollWidth - element.clientWidth;
    const atStart = element.scrollLeft <= 1;
    const atEnd = element.scrollLeft >= maxScroll - 1;

    setFade(
      maxScroll <= 1 ? 'none' : atStart ? 'end' : atEnd ? 'start' : 'both',
    );
  }, []);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });

    return () => {
      element.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [update]);

  return [ref, fade];
}
