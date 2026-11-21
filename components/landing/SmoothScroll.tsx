'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { LANDING_CONFIG } from './landing.config';

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const lenis = new Lenis({
      autoRaf: false,
      anchors: true,
      lerp: LANDING_CONFIG.smoothScroll.lerp,
      respectReducedMotion: true,
    });
    const removeScrollListener = lenis.on('scroll', () => ScrollTrigger.update());
    const tick = (time: number) => lenis.raf(time * 1000);
    let tickerActive = false;

    gsap.ticker.lagSmoothing(0);

    const syncTicker = () => {
      const shouldRun = !document.hidden && !motionPreference.matches;
      if (shouldRun && !tickerActive) {
        lenis.start();
        gsap.ticker.add(tick);
        tickerActive = true;
      } else if (!shouldRun && tickerActive) {
        lenis.stop();
        gsap.ticker.remove(tick);
        tickerActive = false;
      } else if (!shouldRun) {
        lenis.stop();
      }
    };

    document.addEventListener('visibilitychange', syncTicker);
    motionPreference.addEventListener('change', syncTicker);
    syncTicker();

    return () => {
      document.removeEventListener('visibilitychange', syncTicker);
      motionPreference.removeEventListener('change', syncTicker);
      if (tickerActive) gsap.ticker.remove(tick);
      removeScrollListener();
      lenis.destroy();
      gsap.ticker.lagSmoothing(
        LANDING_CONFIG.smoothScroll.restoreLagThresholdMs,
        LANDING_CONFIG.smoothScroll.restoreLagAdjustedFps,
      );
    };
  }, []);

  return children;
}
