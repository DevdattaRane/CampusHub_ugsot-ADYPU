export const LANDING_CONFIG = {
  clock: {
    locale: 'en-IN', // Format the clock for Indian English.
    timeZone: 'Asia/Kolkata', // Keep the displayed time aligned with Pune.
    intervalMs: 1000, // Refresh the visible clock once per second.
  },
  grain: {
    opacity: 0.06, // Keep grain subtle enough to preserve text clarity.
  },
  smoothScroll: {
    lerp: 0.08, // Keep wheel scrolling smooth without feeling detached.
    restoreLagThresholdMs: 500, // Restore GSAP's default lag-smoothing threshold after unmount.
    restoreLagAdjustedFps: 33, // Restore GSAP's default adjusted frame rate after unmount.
  },
  motion: {
    mobileBreakpointPx: 700, // Keep pinned and parallax motion off small layouts.
    navTriggerOffsetPx: 76, // Align nav theme changes to the fixed navigation height.
    pinViewportMultiplier: 1.5, // Keep the statement pinned for one and a half viewports.
    wordStaggerSeconds: 0.025, // Reveal statement words in a restrained sequence.
    parallaxMaxPercent: 10, // Limit parallax travel to less than the 15% maximum.
    pinAnticipation: 1, // Reduce the visual jump when the pinned section begins.
  },
} as const;
