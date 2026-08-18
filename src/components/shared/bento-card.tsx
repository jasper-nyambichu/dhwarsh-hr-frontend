import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * White elevated surface — the base of every bento tile.
 *
 * `title` renders the standard header row with an optional right-hand slot
 * (filter button, "View All" link, period chip). It accepts any node so a tile
 * can lead with a glyph — `<span><Icon name="person" />Personal Details</span>`
 * — while the <h2> stays here, keeping the heading level consistent across
 * tiles. Omit it for tiles that own their whole interior, like the segment
 * strip or the alert spotlight.
 *
 * `flush` drops the body padding so a table or chart can bleed to the card
 * edges. The header keeps its inset, and the body then owns its own spacing —
 * see the device sync list, which re-applies `p-card-padding pt-0`.
 */
export function BentoCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  flush = false,
}: {
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}) {
  return (
    <section
      className={cn(
        // min-w-0 lets a card inside a grid track actually shrink; without it a
        // wide table sets the track's minimum and the whole row overflows.
        "bento-card min-w-0",
        flush || "p-4 sm:p-card-padding",
        className,
      )}
    >
      {title ? (
        <header
          className={cn(
            // Wraps so a long title plus an action chip stack on narrow cards
            // instead of crushing each other.
            "mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2",
            flush && "px-4 pt-4 sm:px-card-padding sm:pt-card-padding",
          )}
        >
          <div className="min-w-0 flex-1">
            <h2 className="font-body-md text-body-md font-semibold text-on-surface">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-[10px] text-outline">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}

      {/* `min-h-0` is the vertical counterpart to `min-w-0`: a flex item's
          automatic minimum size is its content, so without it a `flex-1` chart
          body cannot shrink inside a height-capped card — it keeps its content
          height and the overflow spills onto the card below. */}
      <div className={cn("min-h-0 min-w-0", bodyClassName)}>{children}</div>
    </section>
  );
}
