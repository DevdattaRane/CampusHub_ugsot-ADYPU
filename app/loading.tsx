export default function Loading() {
  return (
    <main className="container page" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading CampusHub page</span>
      <div className="loading-state" aria-hidden="true">
        <div className="loading-state__bar loading-state__bar--short" />
        <div className="loading-state__bar loading-state__bar--title" />
        <div className="loading-state__panel" />
        <div className="loading-state__panel loading-state__panel--small" />
      </div>
    </main>
  );
}
