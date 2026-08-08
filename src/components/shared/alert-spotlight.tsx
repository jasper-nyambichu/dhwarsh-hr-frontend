import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Navy spotlight tile for a single high-priority system message.
 *
 * One message, not a list — it competes for attention with the whole
 * dashboard, so it only earns that weight when there is exactly one thing that
 * matters. Use the approvals list for anything countable.
 *
 * Two densities, both from Stitch: the compact form is `message` alone with a
 * chevron; passing `title`/`description`/`cta` gives the taller treatment with
 * a full-width call to action. The whole tile stays one anchor either way — the
 * CTA is a styled span, not a nested button, so it cannot trap focus or produce
 * invalid interactive nesting.
 */
export function AlertSpotlight({
  eyebrow = "System Alert",
  title,
  message,
  description,
  cta,
  href,
  tone = "warning",
  className,
}: {
  eyebrow?: string;
  /** Headline for the tall form. Omit for the compact one-liner. */
  title?: string;
  message: string;
  /** Supporting sentence under `message`. Only shown in the tall form. */
  description?: string;
  /** Label for the full-width action. Presence switches to the tall form. */
  cta?: string;
  href: string;
  tone?: "warning" | "error" | "info";
  className?: string;
}) {
  const icon =
    tone === "error" ? "error" : tone === "info" ? "info" : "warning";
  const iconColor =
    tone === "error"
      ? "text-error-container"
      : tone === "info"
        ? "text-primary-fixed-dim"
        : "text-amber-main";

  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-card bg-navy p-card-padding text-on-primary shadow-alert",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute -mr-10 -mt-10 right-0 top-0 size-32 rounded-full bg-primary/20 blur-2xl"
      />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 rounded bg-on-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
          <Icon name={icon} className={cn("text-sm", iconColor)} />
          {eyebrow}
        </span>
        {cta ? null : (
          <Icon
            name="arrow_forward_ios"
            className="text-on-primary/50 transition-transform group-hover:translate-x-1"
          />
        )}
      </div>

      {title ? (
        <h3 className="relative z-10 mt-4 font-page-title text-page-title leading-tight">
          {title}
        </h3>
      ) : null}

      <p
        className={cn(
          "relative z-10 font-body-md text-body-md leading-tight",
          title ? "mt-2 opacity-80" : "mt-4 pr-4 font-medium",
        )}
      >
        {message}
      </p>

      {description ? (
        <p className="relative z-10 mt-2 font-body-md text-body-md leading-tight opacity-70">
          {description}
        </p>
      ) : null}

      {cta ? (
        <span className="relative z-10 mt-6 block w-full rounded-lg bg-on-primary py-2.5 text-center font-body-md text-body-md font-bold text-navy shadow-sm transition-colors group-hover:bg-surface-container-low">
          {cta}
        </span>
      ) : null}
    </Link>
  );
}
