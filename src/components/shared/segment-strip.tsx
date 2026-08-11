import { cn } from "@/lib/utils";

/**
 * Divided strip of counts — the daily attendance summary tile.
 *
 * Equal-width cells with hairline dividers, no card header. Values are
 * pre-formatted by the caller.
 */

export type Segment = {
  label: string;
  value: string;
  /** Tailwind text colour class. Defaults to the neutral on-surface. */
  tone?: "default" | "warning" | "error" | "success";
};

const TONE_CLASS: Record<NonNullable<Segment["tone"]>, string> = {
  default: "text-on-surface",
  warning: "text-amber-main",
  error: "text-error",
  success: "text-green-main",
};

export function SegmentStrip({
  segments,
  className,
}: {
  segments: readonly Segment[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-shadow flex divide-x divide-outline-variant/20 overflow-hidden rounded-card bg-surface-container-lowest",
        className,
      )}
    >
      {segments.map((segment) => (
        <div
          key={segment.label}
          className="flex flex-1 flex-col items-center justify-center py-4"
        >
          <span className="mb-1 max-w-full truncate px-1 text-[10px] text-outline">{segment.label}</span>
          <span
            className={cn(
              "max-w-full truncate px-1 font-body-md text-body-md font-bold tabular-nums",
              TONE_CLASS[segment.tone ?? "default"],
            )}
          >
            {segment.value}
          </span>
        </div>
      ))}
    </div>
  );
}
