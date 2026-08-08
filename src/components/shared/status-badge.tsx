import { cn } from "@/lib/utils";
import { humanizeEnum } from "@/lib/format";

/**
 * Status pill covering every status enum in the schema — employment, leave,
 * loan, payroll run, attendance, advance, device.
 *
 * Grouped by meaning rather than by module, so a PENDING loan and a PENDING
 * leave request read identically to the user.
 */

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  danger: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
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
    return <span className="text-sm text-muted-foreground">—</span>;
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
