'use client';

import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { LANDING_CONFIG } from './landing.config';

type TriggerTask = {
  element: HTMLElement;
  type: 'nav' | 'parallax' | 'statement';
};

function compareDocumentOrder(first: TriggerTask, second: TriggerTask): number {
  if (first.element === second.element) return 0;
  const position = first.element.compareDocumentPosition(second.element);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

export default function ScrollEffects() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('[data-landing-nav]');
    const navSections = gsap.utils.toArray<HTMLElement>('[data-nav-theme]');
    const parallaxTargets = gsap.utils.toArray<HTMLElement>('[data-parallax]');
    const statement = document.querySelector<HTMLElement>('[data-pinned-statement]');
    const tasks: TriggerTask[] = [
      ...navSections.map((element) => ({ element, type: 'nav' as const })),
      ...parallaxTargets.map((element) => ({ element, type: 'parallax' as const })),
      ...(statement ? [{ element: statement, type: 'statement' as const }] : []),
    ].sort(compareDocumentOrder);
    const motionQuery = window.matchMedia(
      `(min-width: ${LANDING_CONFIG.motion.mobileBreakpointPx + 1}px) and (pointer: fine) and (prefers-reduced-motion: no-preference)`,
    );
    let context: gsap.Context | undefined;
    let disposed = false;

    const setNavThemeAtCurrentPosition = () => {
      if (!nav) return;
      const triggerLine = LANDING_CONFIG.motion.navTriggerOffsetPx;
      const currentSection = navSections.reduce<HTMLElement | null>((active, section) => {
        if (section.getBoundingClientRect().top <= triggerLine) return section;
        return active;
      }, null);
      nav.dataset.theme = currentSection?.dataset.navTheme === 'dark' ? 'dark' : 'light';
    };

    const buildTriggers = () => {
      context?.revert();
      setNavThemeAtCurrentPosition();
      context = gsap.context(() => {
        tasks.forEach(({ element, type }, index) => {
          if (type === 'nav') {
            ScrollTrigger.create({
              trigger: element,
              start: `top ${LANDING_CONFIG.motion.navTriggerOffsetPx}px`,
              end: `bottom ${LANDING_CONFIG.motion.navTriggerOffsetPx}px`,
              onEnter: () => {
                if (nav) nav.dataset.theme = element.dataset.navTheme === 'dark' ? 'dark' : 'light';
              },
              onEnterBack: () => {
                if (nav) nav.dataset.theme = element.dataset.navTheme === 'dark' ? 'dark' : 'light';
              },
            });
            return;
          }

          if (!motionQuery.matches) return;

          if (type === 'statement') {
            const words = gsap.utils.toArray<HTMLElement>('[data-statement-word]', element);
            if (!words.length) return;
            gsap.fromTo(
              words,
              { opacity: 0.15 },
              {
                opacity: 1,
                ease: 'none',
                stagger: LANDING_CONFIG.motion.wordStaggerSeconds,
                scrollTrigger: {
                  trigger: element,
                  start: 'top top',
                  end: () => `+=${Math.round(window.innerHeight * LANDING_CONFIG.motion.pinViewportMultiplier)}`,
                  pin: true,
                  pinSpacing: true,
                  scrub: true,
                  anticipatePin: LANDING_CONFIG.motion.pinAnticipation,
                  invalidateOnRefresh: true,
                },
              },
            );
            return;
          }

          gsap.to(element, {
            yPercent: index % 2 === 0
              ? -LANDING_CONFIG.motion.parallaxMaxPercent
              : LANDING_CONFIG.motion.parallaxMaxPercent,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        });
      });
      ScrollTrigger.refresh();
    };

    const refresh = () => {
      if (!disposed) ScrollTrigger.refresh();
    };
    const images = Array.from(document.images).filter((image) => !image.complete);
    images.forEach((image) => {
      image.addEventListener('load', refresh);
      image.addEventListener('error', refresh);
    });

    motionQuery.addEventListener('change', buildTriggers);
    buildTriggers();
    void document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh, { once: true });

    return () => {
      disposed = true;
      motionQuery.removeEventListener('change', buildTriggers);
      window.removeEventListener('load', refresh);
      images.forEach((image) => {
        image.removeEventListener('load', refresh);
        image.removeEventListener('error', refresh);
      });
      context?.revert();
    };
  }, []);

  return null;
}
