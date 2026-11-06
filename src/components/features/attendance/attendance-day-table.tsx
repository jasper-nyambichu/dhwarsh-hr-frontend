import { differenceInMinutes, parseISO } from "date-fns";

import { clockTime } from "@/components/features/attendance/checkout-types";
import { formatHours, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AttendanceCheckoutItem, AttendanceRecordItem } from "@/types";

/**
 * One employee's day, as the Back Office application records it: check-in, lunch break,
 * temporary check-out and check-out. The Branch Manager's and the Admin's attendance lists
 * both render this, so the two always show the same events in the same columns.
 */
export type AttendanceDayRow = {
  key: string;
  name: string;
  code: string | null;
  record: AttendanceRecordItem | null;
  /** Shown instead of times when the employee has no scan that day. */
  absence?: { label: string; off: boolean };
};

const PILL = "inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium";
const NEUTRAL = "bg-surface-container text-on-surface-variant";
const GOOD = "bg-tertiary-container/15 text-tertiary";
const WARN = "bg-amber-main/15 text-amber-main";
const BAD = "bg-error-container/40 text-error";
const HEADER = "whitespace-nowrap pb-3 pl-4 font-table-header text-table-header uppercase text-outline";

function minutesBetween(from: string, to: string | null): number | null {
  if (!to) return null;
  try {
    return Math.max(0, differenceInMinutes(parseISO(to), parseISO(from)));
  } catch {
    return null;
  }
}

function duration(minutes: number): string {
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m` : `${minutes} min`;
}

function Period({ item }: { item: AttendanceCheckoutItem }) {
  return (
    <span className="whitespace-nowrap tabular-nums text-on-surface">
      {clockTime(item.checkedOutAt)} → {item.checkedInAt ? clockTime(item.checkedInAt) : "…"}
    </span>
  );
}

function LunchBreaks({ items }: { items: AttendanceCheckoutItem[] }) {
  if (items.length === 0) return <span className="text-outline">—</span>;

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Period item={item} />
          {item.returnStatus === "OUT" ? (
            <span className={cn(PILL, WARN)}>Out · due {clockTime(item.expectedBackAt)}</span>
          ) : item.returnStatus === "LATE" ? (
            <span className={cn(PILL, BAD)}>{item.minutesLate ?? 0} min late</span>
          ) : (
            <span className={cn(PILL, GOOD)}>On time</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function TemporaryCheckouts({ items }: { items: AttendanceCheckoutItem[] }) {
  if (items.length === 0) return <span className="text-outline">—</span>;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const asked = minutesBetween(item.checkedOutAt, item.expectedBackAt);
        const away = minutesBetween(item.checkedOutAt, item.checkedInAt);
        return (
          <li key={item.id} className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Period item={item} />
              {asked !== null ? <span className={cn(PILL, NEUTRAL)}>{duration(asked)} asked</span> : null}
              {item.checkedInAt ? (
                <span className={cn(PILL, GOOD)}>Back{away !== null ? ` after ${duration(away)}` : ""}</span>
              ) : (
                <span className={cn(PILL, WARN)}>Out · due {clockTime(item.expectedBackAt)}</span>
              )}
            </div>
            {item.reason ? <p className="mt-0.5 break-words text-[11px] text-on-surface-variant">Reason: {item.reason}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

function CheckOut({ record }: { record: AttendanceRecordItem }) {
  if (record.clockOut) return <span className="tabular-nums">{clockTime(record.clockOut)}</span>;
  return <span className="text-xs text-on-surface-variant">Still at work</span>;
}

function Absence({ absence }: { absence: NonNullable<AttendanceDayRow["absence"]> }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
        absence.off ? "bg-blue-soft text-primary-container" : "bg-amber-main/10 text-amber-main",
      )}
    >
      {absence.label}
    </span>
  );
}

function split(record: AttendanceRecordItem) {
  return {
    lunch: record.checkouts.filter((item) => item.type === "LUNCH"),
    temporary: record.checkouts.filter((item) => item.type !== "LUNCH"),
  };
}

function Avatar({ name, size }: { name: string; size: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-container text-[11px] font-bold text-on-primary",
        size === "sm" ? "size-8" : "size-9",
      )}
    >
      {initials(name)}
    </span>
  );
}

/** The day's events for each employee: a table on wide screens, a card per employee on phones. */
export function AttendanceDayTable({ rows }: { rows: AttendanceDayRow[] }) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => {
          const events = row.record ? split(row.record) : null;
          return (
            <li key={row.key} className="min-w-0 rounded-lg border border-outline-variant/40 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={row.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold text-on-surface">{row.name}</p>
                  <p className="font-mono text-[10px] text-outline">{row.code ?? "—"}</p>
                </div>
                {row.absence && !row.record ? <Absence absence={row.absence} /> : null}
              </div>

              {row.record && events ? (
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-outline-variant/30 pt-3 text-xs">
                  <div>
                    <dt className="mb-0.5 text-outline">Check-in</dt>
                    <dd className="tabular-nums text-on-surface">{clockTime(row.record.clockIn)}</dd>
                  </div>
                  <div>
                    <dt className="mb-0.5 text-outline">Check-out</dt>
                    <dd className="text-on-surface"><CheckOut record={row.record} /></dd>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <dt className="mb-1 text-outline">Lunch break</dt>
                    <dd><LunchBreaks items={events.lunch} /></dd>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <dt className="mb-1 text-outline">Temporary check-out</dt>
                    <dd><TemporaryCheckouts items={events.temporary} /></dd>
                  </div>
                  <div>
                    <dt className="mb-0.5 text-outline">Hours</dt>
                    <dd className="tabular-nums text-on-surface">{formatHours(row.record.hoursWorked)}</dd>
                  </div>
                </dl>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="hidden w-full overflow-x-auto md:block">
        <table className="data-table w-full min-w-[940px] border-collapse text-left">
          <thead>
            <tr>
              <th className={`${HEADER} !pl-2`}>Employee</th>
              <th className={HEADER}>Check-in</th>
              <th className={HEADER}>Lunch break</th>
              <th className={HEADER}>Temporary check-out</th>
              <th className={HEADER}>Check-out</th>
              <th className={`${HEADER} pr-2 text-right`}>Hours</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {rows.map((row) => {
              const events = row.record ? split(row.record) : null;
              return (
                <tr key={row.key} className="border-b border-outline-variant/20 align-top last:border-0 hover:bg-surface">
                  <td className="py-3 pl-2">
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={row.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block font-medium">{row.name}</span>
                        <span className="block font-mono text-[10px] text-outline">{row.code ?? "—"}</span>
                      </span>
                    </span>
                  </td>
                  {row.record && events ? (
                    <>
                      <td className="whitespace-nowrap py-3 pl-4 tabular-nums">{clockTime(row.record.clockIn)}</td>
                      <td className="py-3 pl-4 text-sm"><LunchBreaks items={events.lunch} /></td>
                      <td className="max-w-[320px] py-3 pl-4 text-sm"><TemporaryCheckouts items={events.temporary} /></td>
                      <td className="whitespace-nowrap py-3 pl-4"><CheckOut record={row.record} /></td>
                      <td className="whitespace-nowrap py-3 pl-4 pr-2 text-right tabular-nums">{formatHours(row.record.hoursWorked)}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 pl-4">{row.absence ? <Absence absence={row.absence} /> : <span className="text-outline">—</span>}</td>
                      <td className="py-3 pl-4 text-outline">—</td>
                      <td className="py-3 pl-4 text-outline">—</td>
                      <td className="py-3 pl-4 text-outline">—</td>
                      <td className="py-3 pl-4 pr-2 text-right text-outline">—</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
