import { format, parseISO } from "date-fns";

import type { AttendanceRecordItem } from "@/types";

export function clockTime(value: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "HH:mm");
  } catch {
    return value;
  }
}

/** The choices for filtering a day's list. Lunch and temporary check-out scans come from the Back Office application. */
export const CHECKOUT_FILTERS = [
  { value: "LUNCH_ON_TIME", label: "Back from lunch on time" },
  { value: "LUNCH_LATE", label: "Back from lunch late" },
  { value: "LUNCH_OUT", label: "Out for lunch" },
  { value: "EMERGENCY", label: "Temporary check-out" },
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
