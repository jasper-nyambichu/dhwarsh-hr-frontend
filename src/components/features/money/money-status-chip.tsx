import { humanizeEnum } from "@/lib/format";

const SUCCESS = "bg-primary/10 text-primary";
const FAILURE = "bg-error/10 text-error";
const NEUTRAL = "bg-surface-container-low text-on-surface-variant";

const STYLE: Record<string, { label: string; chip: string }> = {
  PENDING: { label: "Waiting for Administrator", chip: NEUTRAL },
  APPROVED: { label: "Approved", chip: SUCCESS },
  REJECTED: { label: "Rejected", chip: FAILURE },
  RELEASED: { label: "Money released", chip: SUCCESS },
  CANCELLED: { label: "Cancelled", chip: NEUTRAL },
  CLOSED: { label: "Fully repaid", chip: NEUTRAL },
  OUTSTANDING: { label: "Approved · outstanding", chip: SUCCESS },
  PARTIALLY_RECOVERED: { label: "Partly recovered", chip: SUCCESS },
  FULLY_RECOVERED: { label: "Fully recovered", chip: NEUTRAL },
};

/** One consistent status pill for loans, advances and payment requests. */
export function MoneyStatusChip({ status, awaitingRelease = false }: { status: string; awaitingRelease?: boolean }) {
  const base = STYLE[status] ?? { label: humanizeEnum(status), chip: NEUTRAL };
  // For a payment request, "approved" really means "now waiting for the Accounts Office".
  const label = awaitingRelease && status === "APPROVED" ? "Approved · awaiting release" : base.label;

  return (
    <span className={`inline-block shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${base.chip}`}>{label}</span>
  );
}