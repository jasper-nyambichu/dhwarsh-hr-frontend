"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Icon } from "@/components/ui/icon";

/**
 * Route-level error boundary for the portal shell.
 *
 * Rendered inside the shell, so a failed page leaves the rail and top bar
 * intact — the user can navigate somewhere else instead of hitting a dead end.
 *
 * `error.message` is deliberately NOT shown. In production Next.js replaces it
 * with a generic string anyway, and in development a raw stack or a leaked
 * query fragment is not something to put in front of an HR user. The `digest`
 * is shown instead: it is the value that correlates with the server log, which
 * is what support actually needs.
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Wire to the real reporter when one exists.
    console.error("Portal route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-error-container/40">
        <Icon name="error" className="text-[28px] text-error" />
      </span>

      <h1 className="font-display-greeting text-lg text-on-surface sm:text-display-greeting">
        This page didn&rsquo;t load
      </h1>

      <p className="mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
        Something went wrong on our side. Your data is safe — nothing was
        changed by this error.
      </p>

      {error.digest ? (
        <p className="mt-3 font-mono text-[10px] text-outline">
          Reference: {error.digest}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          data-live=""
          onClick={reset}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-body-md text-body-md font-semibold text-on-primary shadow-ambient-1 transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Icon name="refresh" className="text-[18px]" />
          Try again
        </button>

        {/* Escape hatch: retrying a page that is deterministically broken just
            reproduces the error, so offer a way out of it. */}
        <Link
          href="/"
          className="flex h-10 items-center justify-center rounded-lg border border-outline-variant px-5 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
