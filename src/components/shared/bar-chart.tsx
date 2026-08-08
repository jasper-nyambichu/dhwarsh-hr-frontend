import { cn } from "@/lib/utils";

/**
 * Vertical bar chart, CSS-only.
 *
 * Deliberately not a charting library: these are small, fixed-height, and
 * render inside a Server Component with no interaction beyond a hover tooltip.
 * Pulling in recharts would ship ~100kB of client JS to draw seven divs.
 *
 * Heights are computed against `max` (defaults to the largest value) so the
 * tallest bar fills the plot area.
 */

export type BarDatum = {
  label: string;
  value: number;
  /** Highlights the bar in green with a glow — use for "current period". */
  highlight?: boolean;
  /** Overrides the tooltip text. Defaults to the raw value. */
  tooltip?: string;
};

export function BarChart({
  data,
  max,
  axisLabels,
  tone = "track",
  className,
}: {
  data: readonly BarDatum[];
  max?: number;
  /** Y-axis ticks, top to bottom. Rendered as-is, no scale derivation. */
  axisLabels?: readonly string[];
  /**
   * Colour of the non-highlighted bars. "track" is the muted grey used when one
   * bar carries the story; "primary" tints the whole series, for trends read as
   * a shape rather than a comparison.
   */
  tone?: "track" | "primary";
  className?: string;
}) {
  // Guard the divide: an all-zero series would otherwise produce NaN heights.
  const ceiling = max ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("relative flex flex-1 items-end gap-2 pb-6 pl-8", className)}>
      {axisLabels?.length ? (
        <div
          aria-hidden
          className="absolute bottom-6 left-0 top-0 flex flex-col justify-between text-[9px] text-outline opacity-50"
        >
          {axisLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      ) : null}

      {/* Grid lines */}
      <div aria-hidden className="absolute inset-x-0 bottom-6 left-8 top-0">
        <div className="absolute inset-x-0 top-0 h-px bg-outline-variant/20" />
        <div className="absolute inset-x-0 top-1/3 h-px bg-outline-variant/20" />
        <div className="absolute inset-x-0 top-2/3 h-px bg-outline-variant/20" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-outline-variant/40" />
      </div>

      {data.map((datum) => {
        const height = Math.max((datum.value / ceiling) * 100, 1);

        return (
          <div
            key={datum.label}
            className="group relative flex-1"
            style={{ height: `${height}%` }}
          >
            <div
              className={cn(
                "h-full w-full rounded-t-sm",
                datum.highlight
                  ? "z-10 bg-green-main shadow-[0_0_8px_rgb(59_154_47/0.4)]"
                  : tone === "primary"
                    ? "bg-primary-container opacity-80"
                    : "bg-chart-track",
              )}
            />

            <span
              role="tooltip"
              className="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-on-surface px-2 py-1 text-[10px] text-on-primary opacity-0 transition-opacity group-hover:opacity-100"
            >
              {datum.tooltip ?? datum.value.toLocaleString()}
              <span
                aria-hidden
                className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-on-surface"
              />
            </span>

            <span
              className={cn(
                "absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px]",
                datum.highlight
                  ? "font-semibold text-on-surface"
                  : "text-outline",
              )}
            >
              {datum.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
