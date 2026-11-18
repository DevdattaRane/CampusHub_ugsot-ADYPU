export default function Loading() {
  return (
    <main className="container page" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading CampusHub page</span>
      <div className="loading-state" aria-hidden="true">
        <div className="loading-state__intro">
          <div className="loading-state__bar loading-state__bar--short" />
          <div className="loading-state__bar loading-state__bar--title" />
        </div>
        <div className="loading-state__rows">
          {[0, 1, 2, 3].map((row) => (
            <div className="loading-state__row" key={row}>
              <div className="loading-state__bar loading-state__bar--mark" />
              <div className="loading-state__row-copy">
                <div className="loading-state__bar loading-state__bar--row-title" />
                <div className="loading-state__bar loading-state__bar--meta" />
              </div>
              <div className="loading-state__bar loading-state__bar--end" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
