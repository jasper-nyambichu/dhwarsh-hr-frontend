import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * KPI tile on the primary fill — the top row of every dashboard.
 *
 * Value is pre-formatted by the caller; this component never does arithmetic
 * on money. The oversized watermark glyph is decorative and clipped by the
 * card, matching the Stitch treatment.
 */
export function StatCard({
  label,
  value,
  icon,
  badgeIcon,
  hint,
  className,
}: {
  label: string;
  /** Pre-formatted. Use formatMoney/formatNumber at the call site. */
  value: string;
  /** Material Symbols ligature for the watermark. */
  icon: string;
  /** Material Symbols ligature for the small chip, top-right. */
  badgeIcon?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-shadow group relative min-w-0 overflow-hidden rounded-card bg-primary-container p-4 text-on-primary sm:p-card-padding",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute -bottom-4 -right-4 opacity-10 transition-transform group-hover:scale-110"
      >
        <Icon name={icon} className="text-[100px]" />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-2">
        <p className="min-w-0 font-body-md text-body-md opacity-90">{label}</p>
        {badgeIcon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest/20">
            <Icon name={badgeIcon} className="text-sm" />
          </span>
        ) : null}
      </div>

      <p className="relative z-10 mt-stack-md break-words font-card-stat text-card-stat tabular-nums">
        {value}
      </p>

      {hint ? (
        <p className="relative z-10 mt-1 text-[10px] opacity-80">{hint}</p>
      ) : null}
    </div>
  );
}
