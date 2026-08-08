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
 */
export function BentoCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "bento-card p-card-padding",
        className,
      )}
    >
      {title ? (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
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

      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
