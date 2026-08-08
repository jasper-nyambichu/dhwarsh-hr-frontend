"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-8 text-center">
      <span className="material-symbols-outlined text-[32px] text-error">error</span>
      <p className="mt-3 font-display-greeting text-display-greeting text-on-surface">
        Something went wrong
      </p>
      <p className="mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-navy px-4 py-2 font-body-md text-body-md font-bold text-white"
      >
        Try again
      </button>
    </div>
  );
}
