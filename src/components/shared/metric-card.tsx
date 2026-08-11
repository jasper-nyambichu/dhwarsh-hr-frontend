import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * White KPI tile with a tinted icon chip.
 *
 * The counterpart to `StatCard`: that one is the filled primary tile that opens
 * a dashboard, this one is the lighter tile Stitch uses for counts that need to
 * sit together without three blocks of solid blue competing for attention.
 *
 * `accent` adds the coloured left edge Stitch puts on tiles that carry a
 * deadline ("Probation Ending", "Docs Expiring"). Leave it off for neutral
 * counts — the edge is a severity signal, not decoration.
 */

export type MetricTone = "primary" | "error" | "tertiary" | "amber";

const TONE: Record<MetricTone, { chip: string; edge: string }> = {
  primary: {
    chip: "bg-blue-soft text-primary-container",
    edge: "border-l-4 border-primary-container",
  },
  error: {
    chip: "bg-error-container/30 text-error",
    edge: "border-l-4 border-error",
  },
  tertiary: {
    chip: "bg-tertiary-container/20 text-tertiary",
    edge: "border-l-4 border-tertiary",
  },
  amber: {
    chip: "bg-amber-main/15 text-amber-main",
    edge: "border-l-4 border-amber-main",
  },
};

export function MetricCard({
  label,
  value,
  icon,
  tone = "primary",
  accent = false,
  hint,
  trend,
  className,
}: {
  label: string;
  /** Pre-formatted. Use formatNumber/formatMoney at the call site. */
  value: string;
  /** Material Symbols ligature for the chip. */
  icon: string;
  tone?: MetricTone;
  /** Draws the coloured left edge. Reserve it for time-sensitive counts. */
  accent?: boolean;
  hint?: string;
  /** Signed movement, e.g. "+2.4% this month". Direction comes from the sign. */
  trend?: string;
  className?: string;
}) {
  const styles = TONE[tone];
  const rising = trend?.trimStart().startsWith("+");

  return (
    <div
      className={cn(
        // .bento-card already carries the white fill, radius, ambient shadow
        // and hover lift — do not also add .card-shadow, they duplicate.
        "bento-card flex min-w-0 flex-col justify-between p-4 sm:p-card-padding",
        accent && styles.edge,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 font-body-md text-body-md text-on-surface-variant">
          {label}
        </p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            styles.chip,
          )}
        >
          <Icon name={icon} className="text-sm" />
        </span>
      </div>

      {/* `break-words` rather than `truncate`: a clipped currency figure is
          worse than a wrapped one — "KES 1,2…" is actively misleading. */}
      <p className="mt-4 break-words font-card-stat text-card-stat tabular-nums text-on-surface">
        {value}
      </p>

      {trend ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-[10px]",
            rising ? "text-green-main" : "text-error",
          )}
        >
          <Icon
            name={rising ? "trending_up" : "trending_down"}
            className="text-[14px]"
          />
          {trend}
        </p>
      ) : null}

      {hint ? (
        <p className="mt-2 text-[10px] text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}
