'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseScrollSpyOptions {
  sectionIds: string[];
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
}

export function useScrollSpy({
  sectionIds,
  rootMargin = '-30% 0px -50% 0px',
  threshold = 0.1,
  enabled = true,
}: UseScrollSpyOptions): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionsRef = useRef<Map<string, Element>>(new Map());

  const sectionKey = useMemo(() => sectionIds.join(','), [sectionIds]);

  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    sectionsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) {
      cleanup();
      return;
    }

    cleanup();

    const visibleSections = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-scrollspy-id');
          if (!id) return;

          if (entry.isIntersecting) {
            visibleSections.set(id, entry.intersectionRatio);
          } else {
            visibleSections.delete(id);
          }
        });

        if (visibleSections.size > 0) {
          let bestId: string | null = null;
          let bestRatio = -1;
          visibleSections.forEach((ratio, id) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestId = id;
            }
          });
          if (bestId) setActiveId(bestId);
        } else {
          setActiveId(null);
        }
      },
      { rootMargin, threshold: [0, threshold, 0.5, 1] }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute('data-scrollspy-id', id);
        sectionsRef.current.set(id, el);
        observerRef.current!.observe(el);
      }
    });

    return cleanup;
  }, [sectionKey, rootMargin, threshold, enabled, cleanup, sectionIds]);

  return activeId;
}
