'use client';

import { useCallback, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TAGLINE = 'Build together. Ship in the open.';
const SEEN_KEY = 'campushub-intro-seen';
const INTRO_EVENT = 'campushub-intro-state-change';

function subscribeToIntro(callback: () => void) {
  window.addEventListener(INTRO_EVENT, callback);
  return () => window.removeEventListener(INTRO_EVENT, callback);
}

function getIntroOpen() {
  return document.documentElement.dataset.introSeen !== 'true';
}

function getServerIntroOpen() {
  return true;
}

export default function IntroScreen() {
  const open = useSyncExternalStore(subscribeToIntro, getIntroOpen, getServerIntroOpen);
  const router = useRouter();
  const dialogRef = useRef<HTMLElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, 'true');
    } catch (error) {
      console.error('Unable to save the intro screen session state.', error);
    }
    document.documentElement.dataset.introSeen = 'true';
    delete document.documentElement.dataset.introFirstVisit;
    window.dispatchEvent(new Event(INTRO_EVENT));
    router.replace('/');
  }, [router]);

  useLayoutEffect(() => {
    const app = document.getElementById('app-content');
    if (!open) {
      app?.removeAttribute('aria-hidden');
      if (app) app.inert = false;
      app?.focus({ preventScroll: true });
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousAriaHidden = app?.getAttribute('aria-hidden');
    const previousInert = app?.inert;

    if (app) {
      app.setAttribute('aria-hidden', 'true');
      app.inert = true;
    }
    document.body.style.overflow = 'hidden';
    enterRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (app) {
        app.inert = previousInert ?? false;
        if (previousAriaHidden === null || previousAriaHidden === undefined) app.removeAttribute('aria-hidden');
        else app.setAttribute('aria-hidden', previousAriaHidden);
      }
    };
  }, [close, open]);

  if (!open) return null;

  return (
    <div className="intro-screen">
      <section ref={dialogRef} className="intro-screen__content" role="dialog" aria-modal="true" aria-labelledby="intro-title" aria-describedby="intro-tagline" tabIndex={-1}>
        <div className="intro-screen__main">
          <div className="intro-screen__copy">
            <span className="tag intro-screen__tag">UGSOT · ADYPU</span>
            <h1 id="intro-title" className="intro-screen__title">
              <span>Open Source</span>
              <span className="intro-screen__accent">Club</span>
            </h1>
            <p id="intro-tagline" className="intro-screen__tagline">{TAGLINE}</p>
            <div className="intro-screen__actions">
              <button ref={enterRef} type="button" className="btn btn--primary intro-screen__enter" onClick={close}>
                Enter CampusHub
              </button>
              <Link href="/" className="intro-screen__skip" onClick={(event) => { event.preventDefault(); close(); }}>
                Skip
              </Link>
            </div>
          </div>
          <div className="intro-screen__logo" role="img" aria-label="Open Source Club logo placeholder">
            <span>Club</span>
            <span>logo</span>
          </div>
        </div>
        <span className="intro-screen__footer">A place to learn, build, and share.</span>
      </section>
    </div>
  );
}
