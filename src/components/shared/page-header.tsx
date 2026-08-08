import type { ReactNode } from "react";

/**
 * Standard page heading for list and detail screens.
 *
 * Dashboards do not use this — their title lives in the top bar greeting.
 *
 * `title` accepts any node so a detail screen can prefix a back-link, but the
 * <h1> lives here — pass the content, never your own heading element.
 *
 * `pill` is for a live count or status beside the title ("9 Active"), not for
 * arbitrary chrome; it sits inside the <h1> so screen readers announce it with
 * the heading.
 */
export function PageHeader({
  title,
  description,
  pill,
  actions,
}: {
  title: ReactNode;
  description?: string;
  pill?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="flex flex-wrap items-center gap-3 font-display-greeting text-display-greeting text-primary">
          {title}
          {pill}
        </h1>
        {description ? (
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * Count/status chip for PageHeader's `pill` slot.
 *
 * The leading dot is decorative — tone alone must never be the only carrier of
 * meaning, so `label` always spells it out ("9 Active", not a bare "9").
 */
export function CountPill({
  label,
  tone = "success",
}: {
  label: string;
  tone?: "success" | "warning" | "error" | "neutral";
}) {
  const styles = {
    success:
      "border-tertiary-container/20 bg-tertiary-container/10 text-tertiary [--dot:var(--color-tertiary)]",
    warning:
      "border-amber-main/20 bg-amber-main/10 text-amber-main [--dot:var(--color-amber-main)]",
    error: "border-error/20 bg-error/10 text-error [--dot:var(--color-error)]",
    neutral:
      "border-outline-variant/40 bg-surface-container text-on-surface-variant [--dot:var(--color-outline)]",
  }[tone];

  return (
    <span
      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold ${styles}`}
    >
      <span
        aria-hidden
        className="block size-1.5 rounded-full bg-[var(--dot)]"
      />
      {label}
    </span>
  );
}
