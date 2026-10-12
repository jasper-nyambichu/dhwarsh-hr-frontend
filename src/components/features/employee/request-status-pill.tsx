import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { EmployeeRequestStatus } from "@/types/employee-request";

/**
 * Status pill for an employee-creation request.
 *
 * Same tones as `StatusBadge` (so a PENDING request reads like every other
 * pending thing in the portal), but with the leading dot / glyph and the fuller
 * label the request screens call for: "Pending review" says what is being
 * waited on, where a bare "Pending" does not.
 *
 * Colour is never the only signal — the pending dot pulses, and the decided
 * states carry a check or cross glyph as well as their label.
 */
const STYLES: Record<
  EmployeeRequestStatus,
  { label: string; pill: string }
> = {
  PENDING: {
    label: "Pending review",
    pill: "border-amber-main/30 bg-amber-main/15 text-amber-main",
  },
  APPROVED: {
    label: "Approved",
    pill: "border-tertiary-container/25 bg-tertiary-container/15 text-tertiary",
  },
  REJECTED: {
    label: "Rejected",
    pill: "border-error/20 bg-error-container/40 text-error",
  },
};

export function RequestStatusPill({
  status,
  short = false,
  className,
}: {
  status: EmployeeRequestStatus;
  /** "Pending" instead of "Pending review" — for tight table cells. */
  short?: boolean;
  className?: string;
}) {
  const style = STYLES[status];
  const label = short && status === "PENDING" ? "Pending" : style.label;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        style.pill,
        className,
      )}
    >
      {status === "PENDING" ? (
        <span
          aria-hidden
          className="block size-1.5 animate-pulse rounded-full bg-amber-main"
        />
      ) : (
        <Icon
          name={status === "APPROVED" ? "check_circle" : "cancel"}
          filled
          className="text-[14px]"
        />
      )}
      {label}
    </span>
  );
}