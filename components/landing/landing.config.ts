export const LANDING_CONFIG = {
  clock: {
    locale: 'en-IN', // Format the clock for Indian English.
    timeZone: 'Asia/Kolkata', // Keep the displayed time aligned with Pune.
    intervalMs: 1000, // Refresh the visible clock once per second.
  },
  grain: {
    opacity: 0.06, // Keep grain subtle enough to preserve text clarity.
  },
} as const;
