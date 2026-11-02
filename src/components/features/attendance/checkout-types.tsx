import { format, parseISO } from "date-fns";

import { cn } from "@/lib/utils";
import type { AttendanceCheckoutItem, AttendanceRecordItem } from "@/types";

export function clockTime(value: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "HH:mm");
  } catch {
    return value;
  }
}

/** The choices for filtering a day's list. Lunch and emergency scans come from the Back Office application. */
export const CHECKOUT_FILTERS = [
  { value: "LUNCH_ON_TIME", label: "Back from lunch on time" },
  { value: "LUNCH_LATE", label: "Back from lunch late" },
  { value: "LUNCH_OUT", label: "Out for lunch" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "END_OF_DAY", label: "Checked out for the day" },
  { value: "STILL_IN", label: "Not checked out" },
] as const;

export function matchesCheckoutFilter(record: AttendanceRecordItem, filter: string | undefined): boolean {
  const lunch = (status: string) => record.checkouts.some((item) => item.type === "LUNCH" && item.returnStatus === status);

  switch (filter) {
    case "LUNCH_ON_TIME":
      return lunch("ON_TIME");
    case "LUNCH_LATE":
      return lunch("LATE");
    case "LUNCH_OUT":
      return lunch("OUT");
    case "EMERGENCY":
      return record.checkouts.some((item) => item.type === "EMERGENCY");
    case "END_OF_DAY":
      return record.clockOut !== null;
    case "STILL_IN":
      return record.clockOut === null;
    default:
      return true;
  }
}

const NEUTRAL = "bg-surface-container text-on-surface-variant";
const GOOD = "bg-tertiary-container/15 text-tertiary";
const WARN = "bg-amber-main/15 text-amber-main";
const BAD = "bg-error-container/40 text-error";

function describe(item: AttendanceCheckoutItem): { label: string; tone: string } {
  const name = item.type === "LUNCH" ? "Lunch" : item.type === "EMERGENCY" ? "Emergency" : item.type;
  const period = `${clockTime(item.checkedOutAt)}–${clockTime(item.checkedInAt)}`;

  switch (item.returnStatus) {
    case "OUT":
      return {
        label: `${name}: out since ${clockTime(item.checkedOutAt)}${item.expectedBackAt ? `, due back ${clockTime(item.expectedBackAt)}` : ""}`,
        tone: WARN,
      };
    case "LATE":
      return { label: `${name} ${period}: back ${item.minutesLate} min late`, tone: BAD };
    case "ON_TIME":
      return { label: `${name} ${period}: back on time`, tone: GOOD };
    default:
      return { label: `${name} ${period}`, tone: item.type === "EMERGENCY" ? WARN : NEUTRAL };
  }
}

/** Every time this employee stepped out today, and how the day ended. */
export function CheckoutTypes({ record }: { record: AttendanceRecordItem }) {
  if (record.checkouts.length === 0 && !record.clockOut) {
    return <span className="text-xs text-on-surface-variant">—</span>;
  }

  return (
    <ul className="flex flex-col items-start gap-1">
      {record.checkouts.map((item) => {
        const { label, tone } = describe(item);
        return (
          <li key={item.id} className="min-w-0">
            <span className={cn("inline-block rounded-md px-2 py-0.5 text-[11px] font-medium", tone)}>{label}</span>
            {item.reason ? <span className="mt-0.5 block break-words text-[11px] text-on-surface-variant">Reason: {item.reason}</span> : null}
          </li>
        );
      })}
      {record.clockOut ? (
        <li><span className={cn("inline-block rounded-md px-2 py-0.5 text-[11px] font-medium", NEUTRAL)}>Checked out for the day</span></li>
      ) : null}
    </ul>
  );
}
