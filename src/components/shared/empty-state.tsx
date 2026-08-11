import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Shown when a list or table has no rows.
 *
 * Token note: this previously used shadcn's default palette (`border-border`,
 * `bg-muted`, `text-muted-foreground`). None of those are defined in this
 * project's `@theme` block, so they compiled to nothing and every empty state
 * rendered with an invisible border and unstyled text. It now uses the same
 * Material tokens as the rest of the app.
 *
 * Takes either a Lucide component (`icon`) or a Material Symbols ligature
 * (`symbol`) — the app uses the icon font nearly everywhere, but the original
 * signature took a Lucide icon, so both keep working.
 */
export function EmptyState({
  title,
  description,
  icon: LucideGlyph,
  symbol,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Material Symbols ligature, e.g. "inbox". Takes precedence over `icon`. */
  symbol?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-outline-variant px-4 py-10 text-center sm:px-6 sm:py-16",
        className,
      )}
    >
      {symbol || LucideGlyph ? (
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-surface-container">
          {symbol ? (
            <Icon name={symbol} className="text-[22px] text-on-surface-variant" />
          ) : LucideGlyph ? (
            <LucideGlyph className="size-5 text-on-surface-variant" aria-hidden />
          ) : null}
        </div>
      ) : null}

      <p className="font-body-md text-sm font-semibold text-on-surface">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm font-body-md text-body-md text-on-surface-variant">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
