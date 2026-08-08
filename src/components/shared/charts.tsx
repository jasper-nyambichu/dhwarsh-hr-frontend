import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Horizontal stacked bar with a legend underneath.
 *
 * Segments are proportional to their own values — the caller passes counts,
 * not percentages, so the widths cannot drift out of sync with the legend
 * numbers shown beside them.
 */

export type StackSegment = {
  label: string;
  value: number;
  /** Any CSS colour. Use a token: `var(--color-blue)`. */
  color: string;
};

export function StackedBar({
  segments,
  className,
}: {
  segments: readonly StackSegment[];
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-3 w-full overflow-hidden rounded-full shadow-inner">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="h-full"
            style={{
              width: total > 0 ? `${(segment.value / total) * 100}%` : "0%",
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>

      <ul className="mt-4 flex items-center justify-between gap-2 px-2">
        {segments.map((segment) => (
          <li key={segment.label} className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-[10px] font-semibold tabular-nums text-on-surface">
                {segment.value.toLocaleString()}
              </span>
            </div>
            <span className="mt-0.5 text-[9px] text-outline">{segment.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Donut split, drawn with a conic-gradient over a punched-out centre.
 *
 * Same rationale as BarChart — no client JS for what is one gradient and a
 * legend. Percentages are derived from the segment values.
 *
 * `centerLabel` fills the punched-out middle with the total; `legend: "value"`
 * shows raw counts instead of percentages. Stitch uses both treatments — the
 * admin workforce split shows percentages, the HR employment-type card shows
 * headcounts against a total in the middle.
 */
export function DonutChart({
  segments,
  size = 96,
  legend = "percent",
  centerLabel,
  className,
}: {
  segments: readonly StackSegment[];
  size?: number;
  legend?: "percent" | "value";
  /** Caption under the centre total, e.g. "Total". Omit to leave it empty. */
  centerLabel?: string;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  // conic-gradient wants cumulative stops: `colour <from>% <to>%`. Each offset
  // is derived from a prefix sum rather than a mutable cursor, so the callback
  // stays pure; with three to five segments the repeated sum costs nothing.
  const stops = segments
    .map((segment, index) => {
      const before = segments
        .slice(0, index)
        .reduce((sum, s) => sum + s.value, 0);
      const from = (before / total) * 100;
      const to = from + (segment.value / total) * 100;
      return `${segment.color} ${from}% ${to}%`;
    })
    .join(", ");

  return (
    <div
      className={cn(
        centerLabel
          ? "flex flex-col items-center gap-6"
          : "flex items-center gap-4",
        className,
      )}
    >
      <div
        className="relative flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${stops})`,
        }}
      >
        <div
          className="absolute flex flex-col items-center justify-center rounded-full bg-surface-container-lowest shadow-inner"
          style={{ width: size * 0.66, height: size * 0.66 }}
        >
          {centerLabel ? (
            <>
              <span className="font-card-stat text-card-stat leading-none tabular-nums text-on-surface">
                {total.toLocaleString()}
              </span>
              <span className="mt-1 text-[10px] text-on-surface-variant">
                {centerLabel}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <ul
        className={cn(
          "flex flex-col justify-center gap-2",
          centerLabel ? "w-full gap-3" : "flex-1",
        )}
      >
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-[10px] font-medium text-on-surface">
                {segment.label}
              </span>
            </div>
            {legend === "value" ? (
              <span className="text-[10px] font-bold tabular-nums text-on-surface">
                {segment.value.toLocaleString()}
              </span>
            ) : (
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ color: segment.color }}
              >
                {Math.round((segment.value / total) * 100)}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Labelled progress rows — "Leave Requests 75%" over a filled track.
 *
 * Not a chart: each row is an independent ratio, so they do not sum to a whole
 * the way StackedBar's segments do. Values are whole percentages.
 */
export function ProgressRows({
  rows,
  className,
}: {
  rows: readonly { label: string; value: number; color: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-center gap-4", className)}>
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between font-body-md text-body-md text-on-surface-variant">
            <span>{row.label}</span>
            <span className="font-semibold tabular-nums text-on-surface">
              {formatPercent(row.value)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full transition-[width]"
              style={{
                width: `${Math.min(Math.max(row.value, 0), 100)}%`,
                backgroundColor: row.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
