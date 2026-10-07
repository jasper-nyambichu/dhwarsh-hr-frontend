import { cn } from "@/lib/utils";
import { humanizeEnum } from "@/lib/format";

/**
 * Status pill covering every status enum in the schema — employment, leave,
 * loan, payroll run, attendance, advance, device.
 *
 * Grouped by meaning rather than by module, so a PENDING loan and a PENDING
 * leave request read identically to the user.
 *
 * Token note: the neutral tone previously used shadcn's `bg-muted` /
 * `text-muted-foreground`, which are not defined in this project's `@theme`
 * block — neutral pills rendered as unstyled text on no background. The tones
 * below use the app's own Material palette so every status is legible.
 */

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  success: "bg-tertiary-container/15 text-tertiary",
  warning: "bg-amber-main/15 text-amber-main",
  danger: "bg-error-container/40 text-error",
  info: "bg-blue-soft text-primary-container",
};

const STATUS_TONE: Record<string, Tone> = {
  // Positive terminal states
  ACTIVE: "success",
  APPROVED: "success",
  PRESENT: "success",
  COMPLETED: "success",
  SETTLED: "success",
  RECOVERED: "success",
  ONLINE: "success",

  // Awaiting action
  PENDING: "warning",
  PENDING_HR: "warning",
  PROCESSING: "warning",
  PROBATION: "warning",
  LATE: "warning",
  HALF_DAY: "warning",
  OUTSTANDING: "warning",
  DRAFT: "warning",
  /** Clocked in, not yet out — the shift is still open. */
  IN_PROGRESS: "warning",

  // Attendance events. A scan is not a state the employee is "in" — it is the
  // moment they arrived or left — but it is what the live feed shows, so it
  // needs a tone. In is the positive direction, out is simply recorded.
  CLOCK_IN: "success",
  CLOCK_OUT: "info",

  // Negative terminal states
  REJECTED: "danger",
  TERMINATED: "danger",
  SUSPENDED: "danger",
  ABSENT: "danger",
  FAILED: "danger",
  DISABLED: "danger",

  // Informational
  ON_LEAVE: "info",
  HOLIDAY: "info",
  CANCELLED: "neutral",
  INACTIVE: "neutral",
  OFFLINE: "neutral",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  if (!status) {
    return <span className="text-sm text-on-surface-variant">—</span>;
  }

  const tone = STATUS_TONE[status] ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {humanizeEnum(status)}
    </span>
  );
}
