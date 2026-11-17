'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function GlobalMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], .rv'));
    const observer = reducedMotion
      ? null
      : new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible', 'in');
            observer?.unobserve(entry.target);
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

    revealTargets.forEach((target) => {
      if (reducedMotion) target.classList.add('is-visible', 'in');
      else observer?.observe(target);
    });

    const content = document.getElementById('route-content');
    let enterFrame = 0;
    if (!reducedMotion && content) {
      content.classList.remove('route-content--entering');
      enterFrame = requestAnimationFrame(() => content.classList.add('route-content--entering'));
    }

    const progress = document.getElementById('scroll-progress');
    const cursor = document.getElementById('cursor-dot');
    const parallaxTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    const marqueeTracks = Array.from(document.querySelectorAll<HTMLElement>('[data-marquee-track]'));
    let lastY = window.scrollY;
    let direction = 1;
    let speed = 1;
    let cursorX = -99;
    let cursorY = -99;
    let targetX = -99;
    let targetY = -99;
    let marqueeOffset = 0;
    let animationFrame = 0;

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const magneticTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]'));
    const onMagneticMove = (event: PointerEvent) => {
      const element = event.currentTarget as HTMLElement;
      const bounds = element.getBoundingClientRect();
      const x = event.clientX - bounds.left - bounds.width / 2;
      const y = event.clientY - bounds.top - bounds.height / 2;
      element.style.setProperty('--magnetic-x', `${x * 0.16}px`);
      element.style.setProperty('--magnetic-y', `${y * 0.16}px`);
    };
    const onMagneticLeave = (event: PointerEvent) => {
      const element = event.currentTarget as HTMLElement;
      element.style.setProperty('--magnetic-x', '0px');
      element.style.setProperty('--magnetic-y', '0px');
    };

    magneticTargets.forEach((element) => {
      element.classList.add('magnetic');
      element.addEventListener('pointermove', onMagneticMove);
      element.addEventListener('pointerleave', onMagneticLeave);
    });

    const animate = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      lastY = currentY;
      if (Math.abs(delta) > 0.5) direction = delta > 0 ? 1 : -1;
      speed += (direction * (1 + Math.min(Math.abs(delta) / 4, 12)) - speed) * 0.08;

      const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = `scaleX(${pageHeight > 0 ? currentY / pageHeight : 0})`;

      parallaxTargets.forEach((element) => {
        const amount = Number(element.dataset.parallax ?? 0.08);
        element.style.setProperty('--py', `${currentY * amount}px`);
      });

      marqueeTracks.forEach((track) => {
        const width = track.scrollWidth / 2;
        if (width > 0) {
          marqueeOffset = (marqueeOffset - speed + width) % width;
          track.style.transform = `translate3d(${-marqueeOffset}px, 0, 0)`;
        }
      });

      if (cursor && window.matchMedia('(pointer: fine)').matches) {
        cursorX += (targetX - cursorX) * 0.22;
        cursorY += (targetY - cursorY) * 0.22;
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('a, button, [data-magnetic]')) {
        cursor?.classList.add('cursor-dot--active');
      }
    };
    const onPointerOut = () => cursor?.classList.remove('cursor-dot--active');

    if (!reducedMotion) {
      window.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerover', onPointerOver);
      document.addEventListener('pointerout', onPointerOut);
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(enterFrame);
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      magneticTargets.forEach((element) => {
        element.removeEventListener('pointermove', onMagneticMove);
        element.removeEventListener('pointerleave', onMagneticLeave);
      });
    };
  }, [pathname]);

  return (
    <>
      <span id="scroll-progress" className="scroll-progress" aria-hidden="true" />
      <span id="cursor-dot" className="cursor-dot" aria-hidden="true" />
    </>
  );
}
