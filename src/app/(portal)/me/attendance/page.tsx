//src/app/(portal)/employee/attendance/page.tsx
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatPercent } from "@/lib/format";

/**
 * Employee self-service attendance page.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — the calendar grid below models a fixed October
 * layout for the mock. Backend should supply attendance status per day for
 * the selected month rather than a hardcoded grid.
 * ─────────────────────────────────────────────────────────────────────────
 */

type DayStatus = "PRESENT" | "LATE" | "ABSENT" | "WEEKEND" | "FUTURE" | "EMPTY";

type CalendarDay = { day: number | null; status: DayStatus };

type AttendanceRecord = {
  id: number;
  date: string;
  shift: string;
  clockIn: string;
  clockOut: string;
  hours: string;
  status: "PRESENT" | "LATE" | "ABSENT";
};

const CALENDAR_WEEK_1: readonly CalendarDay[] = [
  { day: null, status: "EMPTY" },
  { day: null, status: "EMPTY" },
  { day: 1, status: "PRESENT" },
  { day: 2, status: "PRESENT" },
  { day: 3, status: "LATE" },
  { day: 4, status: "WEEKEND" },
  { day: 5, status: "WEEKEND" },
];

const CALENDAR_WEEK_2: readonly CalendarDay[] = [
  { day: 6, status: "PRESENT" },
  { day: 7, status: "PRESENT" },
  { day: 8, status: "PRESENT" },
  { day: 9, status: "ABSENT" },
  { day: 10, status: "PRESENT" },
  { day: 11, status: "WEEKEND" },
  { day: 12, status: "WEEKEND" },
];

const RECORDS: readonly AttendanceRecord[] = [
  { id: 1, date: "Oct 10, Tue", shift: "General", clockIn: "09:00 AM", clockOut: "06:05 PM", hours: "9h 5m", status: "PRESENT" },
  { id: 2, date: "Oct 09, Mon", shift: "General", clockIn: "-", clockOut: "-", hours: "0h", status: "ABSENT" },
  { id: 3, date: "Oct 03, Fri", shift: "General", clockIn: "09:45 AM", clockOut: "06:30 PM", hours: "8h 45m", status: "LATE" },
];

const DAY_CELL: Record<DayStatus, string> = {
  PRESENT: "bg-tertiary-fixed-dim text-on-tertiary-fixed cursor-pointer hover:ring-2 hover:ring-primary/30",
  LATE: "bg-[#f59e0b] text-white cursor-pointer hover:ring-2 hover:ring-primary/30",
  ABSENT: "bg-error-container border border-error/20 text-on-error-container cursor-pointer hover:ring-2 hover:ring-primary/30",
  WEEKEND: "bg-surface-variant/50 text-on-surface-variant cursor-pointer",
  FUTURE: "bg-surface-variant/30 text-on-surface-variant/50",
  EMPTY: "bg-surface-variant/30",
};

const ROW_BADGE: Record<AttendanceRecord["status"], string> = {
  PRESENT: "bg-tertiary-fixed-dim/20 text-tertiary-container",
  LATE: "bg-[#f59e0b]/20 text-[#b45309]",
  ABSENT: "bg-error-container text-on-error-container",
};

export default async function EmployeeAttendancePage() {
  await requirePermission("attendance:read:self");

  return (
    <>
      <PageHeader
        title="My Attendance"
        actions={
          <div className="flex gap-3">
            <div className="relative">
              <select
                defaultValue="oct_2023"
                className="appearance-none rounded-lg border border-outline-variant bg-white py-2 pl-4 pr-10 text-sm text-on-surface shadow-sm focus:border-primary focus:outline-none"
              >
                <option value="oct_2023">October 2023</option>
                <option value="sep_2023">September 2023</option>
              </select>
              <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-outline" />
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/5">
              <Icon name="download" className="text-sm" />
              Export
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ────────────────────────────── summary column ───────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title="This Month">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="mb-1 text-xs text-on-surface-variant">Present</p>
                <p className="font-card-stat text-card-stat text-primary-container">18</p>
              </div>
              <div className="h-8 w-px bg-surface-variant" />
              <div className="text-center">
                <p className="mb-1 text-xs text-on-surface-variant">Late</p>
                <p className="font-card-stat text-card-stat text-[#f59e0b]">2</p>
              </div>
              <div className="h-8 w-px bg-surface-variant" />
              <div className="text-center">
                <p className="mb-1 text-xs text-on-surface-variant">Absent</p>
                <p className="font-card-stat text-card-stat text-error">1</p>
              </div>
            </div>
          </BentoCard>

          <BentoCard title="Total Hours" flush>
            <div className="p-card-padding pt-0">
              <div className="mb-4 flex items-start justify-between">
                <p className="font-card-stat text-card-stat text-on-surface">
                  152<span className="text-sm font-normal text-on-surface-variant">/160</span>
                </p>
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon name="schedule" />
                </div>
              </div>
              <div className="mb-2 h-2 w-full rounded-full bg-surface-variant">
                <div className="h-2 rounded-full bg-primary" style={{ width: "95%" }} />
              </div>
              <p className="text-right text-xs text-on-surface-variant">{formatPercent(95)} of monthly target</p>
            </div>
          </BentoCard>

          <BentoCard flush>
            <div className="flex rounded-lg bg-surface p-1">
              <button className="flex-1 rounded-md bg-primary py-2 text-xs font-semibold text-white shadow-sm transition-colors">
                All
              </button>
              <button className="flex-1 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:text-on-surface">
                Present
              </button>
              <button className="flex-1 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:text-on-surface">
                Exceptions
              </button>
            </div>
          </BentoCard>
        </div>

        {/* ────────────────────────────── main column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title="October Attendance Pattern"
            action={
              <div className="flex gap-3 text-xs text-on-surface-variant">
                <div className="flex items-center gap-1">
                  <span className="size-3 rounded-full bg-tertiary-fixed-dim" /> Present
                </div>
                <div className="flex items-center gap-1">
                  <span className="size-3 rounded-full bg-[#f59e0b]" /> Late
                </div>
                <div className="flex items-center gap-1">
                  <span className="size-3 rounded-full border border-error/20 bg-error-container" /> Absent
                </div>
              </div>
            }
          >
            <div className="grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
                <div key={label} className="py-1 text-center text-xs font-semibold text-on-surface-variant">
                  {label}
                </div>
              ))}
              {[...CALENDAR_WEEK_1, ...CALENDAR_WEEK_2].map((cell, index) => (
                <div
                  key={index}
                  className={`flex aspect-square flex-col items-center justify-center rounded-md text-xs ${DAY_CELL[cell.status]}`}
                >
                  {cell.day !== null && <span className="font-bold">{cell.day}</span>}
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard title="Daily Records" flush>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-variant bg-surface/50">
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Date</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Shift</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Clock In</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Clock Out</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Hours</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RECORDS.map((record) => (
                    <tr key={record.id} className="border-b border-surface-variant transition-colors last:border-0 hover:bg-surface">
                      <td className="px-4 py-3 font-body-md text-on-surface">{record.date}</td>
                      <td className="px-4 py-3 font-body-md text-on-surface-variant">{record.shift}</td>
                      <td className={`px-4 py-3 font-body-md ${record.status === "LATE" ? "font-medium text-[#f59e0b]" : record.status === "ABSENT" ? "text-error" : "text-on-surface"}`}>
                        {record.clockIn}
                      </td>
                      <td className={`px-4 py-3 font-body-md ${record.status === "ABSENT" ? "text-error" : "text-on-surface"}`}>
                        {record.clockOut}
                      </td>
                      <td className="px-4 py-3 font-body-md text-on-surface">{record.hours}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded px-2 py-1 text-[10px] font-semibold ${ROW_BADGE[record.status]}`}>
                          {record.status === "PRESENT" ? "Present" : record.status === "LATE" ? "Late" : "Absent"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}