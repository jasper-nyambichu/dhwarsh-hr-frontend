/**
 * Route-level loading state for the portal shell.
 *
 * Rendered inside the shell (the top bar and rail stay put) while a route's
 * server components stream in, so navigation reads as "content loading" rather
 * than "the app just crashed". The shape mirrors a typical list screen: a page
 * header, a row of KPI tiles, then a table — so the first paint is as close to
 * the final layout as a skeleton can get.
 */
export default function PortalLoading() {
  return (
    <div className="animate-pulse motion-reduce:animate-none" role="status">
      <span className="sr-only">Loading page…</span>

      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 rounded-md bg-surface-container-high sm:w-64" />
        <div className="h-4 w-72 max-w-full rounded-md bg-surface-container-high/70" />
      </div>

      <div className="mb-gutter grid grid-cols-2 gap-gutter lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-28 rounded-card bg-surface-container-lowest shadow-ambient-1"
          />
        ))}
      </div>

      <div className="rounded-card bg-surface-container-lowest p-4 shadow-ambient-1 sm:p-card-padding">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-5 w-40 rounded-md bg-surface-container-high" />
          <div className="hidden gap-2 sm:flex">
            <div className="h-9 w-24 rounded-lg bg-surface-container-high" />
            <div className="h-9 w-24 rounded-lg bg-surface-container-high" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-surface-container-high/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
