"use client";

import { useEffect } from "react";

/**
 * Global error boundary — the fallback for anything outside the portal shell
 * (the sign-in screens, the kiosk) and for failures in the portal layout
 * itself. Route errors inside the shell are handled by `(portal)/error.tsx`,
 * which keeps the navigation usable.
 *
 * Uses the icon font directly rather than <Icon> so the boundary has as few
 * dependencies as possible — a component that only renders when something has
 * already broken should not be able to break in turn.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-6 text-center sm:p-8">
      <span className="material-symbols-outlined text-[32px] text-error">
        error
      </span>

      <h1 className="mt-3 font-display-greeting text-lg text-on-surface sm:text-display-greeting">
        Something went wrong
      </h1>

      {/* The raw message is withheld on purpose: in production it is a generic
          placeholder, and in development it can carry a stack or internal
          detail that is not useful — or safe — to show a user. */}
      <p className="mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
        The page couldn&rsquo;t be displayed. Try again, and if it keeps
        happening let your administrator know.
      </p>

      {error.digest ? (
        <p className="mt-3 font-mono text-[10px] text-outline">
          Reference: {error.digest}
        </p>
      ) : null}

      <button
        type="button"
        onClick={reset}
        className="mt-6 h-10 rounded-lg bg-navy px-5 font-body-md text-body-md font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Try again
      </button>
    </div>
  );
}
