'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

export default function useInView<T extends Element>(
  rootMargin = '160px 0px',
): { ref: RefObject<T | null>; isInView: boolean } {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, { rootMargin });

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, isInView };
}
