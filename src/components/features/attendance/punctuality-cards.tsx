import { format, parseISO } from "date-fns";
import Link from "next/link";

import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/ui/icon";
import { formatDuration, formatNumber, formatTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EmployeePunctuality, LateLunch, PunctualityDay, PunctualityRating } from "@/types/punctuality";

/**
 * The attendance record in cards: how each employee reports to work and keeps to work time. Arrivals are judged
 * against the work start in Settings, departures against the work end, and lunch against its 30 minutes. Coming
 * back early from lunch is never counted against anyone.
 */

const RATING: Record<PunctualityRating, { label: string; className: string }> = {
  EXCELLENT: { label: "Excellent", className: "bg-green-main/10 text-green-main" },
  GOOD: { label: "Good", className: "bg-blue-soft text-primary-container" },
  FAIR: { label: "Fair", className: "bg-amber-main/10 text-amber-main" },
  POOR: { label: "Poor", className: "bg-error/10 text-error" },
  NO_DATA: { label: "No days yet", className: "bg-surface-container text-on-surface-variant" },
};

export function RatingBadge({ rating }: { rating: PunctualityRating }) {
  const { label, className } = RATING[rating];
  return <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", className)}>{label}</span>;
}

function Meter({ label, value, detail, tone = "primary" }: { label: string; value: number | null; detail: string; tone?: "primary" | "green" }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-on-surface-variant">{label}</span>
        <span className="font-bold tabular-nums text-on-surface">{value === null ? "—" : `${value}%`}</span>
      </div>
      <span aria-hidden className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-container">
        <span
          className={cn("block h-full rounded-full", tone === "green" ? "bg-green-main" : "bg-primary")}
          style={{ width: `${Math.min(value ?? 0, 100)}%` }}
        />
      </span>
      <p className="mt-1 text-[11px] text-on-surface-variant">{detail}</p>
    </div>
  );
}

function Figure({ icon, label, value, warn }: { icon: string; label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-surface-container-low p-2">
      <Icon name={icon} className={cn("text-[18px]", warn ? "text-amber-main" : "text-on-surface-variant")} />
      <span className="min-w-0">
        <span className="block truncate text-[11px] text-on-surface-variant">{label}</span>
        <span className={cn("block text-sm font-bold tabular-nums", warn ? "text-amber-main" : "text-on-surface")}>{value}</span>
      </span>
    </div>
  );
}

const times = (count: number, minutes: number) => (count === 0 ? "None" : `${formatNumber(count)}× · ${formatDuration(minutes)}`);

/** One card per employee for a period. */
export function PunctualityCards({
  rows,
  employeeHref,
  showBranch = true,
}: {
  rows: EmployeePunctuality[];
  employeeHref?: (id: number) => string;
  showBranch?: boolean;
}) {
  if (rows.length === 0) {
    return <EmptyState symbol="group" title="No employees" description="Active employees appear here with their attendance record." />;
  }

  return (
    <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 2xl:grid-cols-3">
      {rows.map((row) => (
        <li key={row.employeeId} className="bento-card flex min-w-0 flex-col gap-4 p-4 sm:p-card-padding">
          <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary">
              {initials(row.employeeName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold text-on-surface">
                {employeeHref ? (
                  <Link href={employeeHref(row.employeeId)} className="hover:text-primary hover:underline">
                    {row.employeeName}
                  </Link>
                ) : (
                  row.employeeName
                )}
              </p>
              <p className="break-words text-xs text-on-surface-variant">
                {[row.employeeNumber, showBranch ? row.branchName : null, row.position].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <RatingBadge rating={row.rating} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Meter
              label="Reported"
              value={row.attendancePercent}
              detail={`${formatNumber(row.daysReported)} of ${formatNumber(row.expectedDays)} days${row.daysMissed > 0 ? ` · ${formatNumber(row.daysMissed)} missed` : ""}`}
            />
            <Meter
              label="On time"
              tone="green"
              value={row.punctualityPercent}
              detail={`${formatNumber(row.onTimeArrivals)} of ${formatNumber(row.daysReported)} arrivals`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Figure icon="schedule" label="Late arrivals" value={times(row.lateArrivals, row.minutesLateArrival)} warn={row.lateArrivals > 0} />
            <Figure icon="logout" label="Left early" value={times(row.earlyLeaves, row.minutesLeftEarly)} warn={row.earlyLeaves > 0} />
            <Figure icon="restaurant" label="Late from lunch" value={times(row.lateLunchReturns, row.minutesLateLunch)} warn={row.lateLunchReturns > 0} />
            <Figure icon="timer" label="Hours worked" value={`${formatNumber(Math.round(row.hoursWorked))} h`} />
          </div>

          {row.daysOff > 0 ? <p className="text-[11px] text-on-surface-variant">{formatNumber(row.daysOff)} day{row.daysOff === 1 ? "" : "s"} off in this period.</p> : null}
        </li>
      ))}
    </ul>
  );
}

function DayCard({ day }: { day: PunctualityDay }) {
  const missed = !day.offDay && !day.clockIn;
  return (
    <li className="flex min-w-0 flex-col gap-2 rounded-lg border border-outline-variant/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-on-surface">{format(parseISO(day.date), "EEE d MMM")}</p>
        {day.offDay ? (
          <span className="rounded-full bg-blue-soft px-2 py-0.5 text-[11px] font-bold text-primary-container">Off day</span>
        ) : missed ? (
          <span className="rounded-full bg-error/10 px-2 py-0.5 text-[11px] font-bold text-error">Did not report</span>
        ) : day.minutesLate ? (
          <span className="rounded-full bg-amber-main/10 px-2 py-0.5 text-[11px] font-bold text-amber-main">Late {formatDuration(day.minutesLate)}</span>
        ) : (
          <span className="rounded-full bg-green-main/10 px-2 py-0.5 text-[11px] font-bold text-green-main">On time</span>
        )}
      </div>
      {day.clockIn ? (
        <p className="text-xs tabular-nums text-on-surface-variant">
          In {formatTime(day.clockIn)} · Out {day.clockOut ? formatTime(day.clockOut) : "still in"}
          {day.hours ? ` · ${day.hours} h` : ""}
        </p>
      ) : null}
      {day.minutesLeftEarly || day.lunchMinutesLate ? (
        <p className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-amber-main">
          {day.minutesLeftEarly ? <span>Left {formatDuration(day.minutesLeftEarly)} early</span> : null}
          {day.lunchMinutesLate ? <span>Lunch {formatDuration(day.lunchMinutesLate)} late</span> : null}
        </p>
      ) : null}
    </li>
  );
}

/** One employee: their figures for the period, then a card per day (newest first). */
export function EmployeePunctualityPanel({ row, workStart, workEnd }: { row: EmployeePunctuality; workStart: string; workEnd: string }) {
  return (
    <div className="flex flex-col gap-gutter">
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="bento-card flex flex-col gap-3 p-4 sm:p-card-padding">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-on-surface">Overall</p>
            <RatingBadge rating={row.rating} />
          </div>
          <Meter label="Reported" value={row.attendancePercent} detail={`${formatNumber(row.daysReported)} of ${formatNumber(row.expectedDays)} days · ${formatNumber(row.daysMissed)} missed`} />
          <Meter label="On time" tone="green" value={row.punctualityPercent} detail={`Measured against each day's hours (e.g. ${formatTime(workStart)} to ${formatTime(workEnd)})`} />
        </div>
        <div className="bento-card grid grid-cols-2 gap-2 p-4 sm:p-card-padding lg:col-span-2">
          <Figure icon="schedule" label="Late arrivals" value={times(row.lateArrivals, row.minutesLateArrival)} warn={row.lateArrivals > 0} />
          <Figure icon="logout" label="Left early" value={times(row.earlyLeaves, row.minutesLeftEarly)} warn={row.earlyLeaves > 0} />
          <Figure icon="restaurant" label="Late from lunch" value={`${times(row.lateLunchReturns, row.minutesLateLunch)} (of ${formatNumber(row.lunches)} lunches)`} warn={row.lateLunchReturns > 0} />
          <Figure icon="timer" label="Hours worked" value={`${formatNumber(Math.round(row.hoursWorked))} h`} />
          <Figure icon="event_busy" label="Days off" value={formatNumber(row.daysOff)} />
          <Figure icon="event_available" label="Days reported" value={formatNumber(row.daysReported)} />
        </div>
      </div>
      {row.days && row.days.length > 0 ? (
        <BentoCard title="Day by day" subtitle="How each day went, newest first">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {row.days.map((day) => (
              <DayCard key={day.date} day={day} />
            ))}
          </ul>
        </BentoCard>
      ) : null}
    </div>
  );
}

/** Dashboard: who came back late from lunch today (and anyone still out past it). */
export function LateLunchCard({ items, href, className }: { items: LateLunch[] | null; href: string; className?: string }) {
  return (
    <BentoCard
      className={className}
      title="Late From Lunch Today"
      subtitle={items && items.length > 0 ? `${formatNumber(items.length)} employee${items.length === 1 ? "" : "s"} past the 30 minutes` : "Lunch is 30 minutes"}
      action={<Link href={href} className="text-[10px] font-semibold text-primary hover:underline">Attendance records</Link>}
    >
      {items === null ? (
        <p className="py-2 text-sm text-on-surface-variant">Lunch returns could not be loaded. Please try again in a few minutes.</p>
      ) : items.length === 0 ? (
        <EmptyState symbol="restaurant" title="Nobody late from lunch" description="Employees back after their 30 minutes appear here." />
      ) : (
        <ul className="no-scrollbar grid max-h-96 grid-cols-1 gap-x-gutter overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={`${item.employeeId}-${item.checkedOutAt}`} className="flex min-w-0 items-start gap-3 border-b border-outline-variant/20 py-2.5">
              <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-main/15 text-[11px] font-bold text-amber-main">
                {initials(item.employeeName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-medium text-on-surface">{item.employeeName ?? `Employee #${item.employeeId}`}</span>
                {item.branchName ? <span className="block break-words text-xs text-outline">{item.branchName}</span> : null}
                <span className="block text-xs tabular-nums text-on-surface-variant">
                  Out {formatTime(item.checkedOutAt)} · due {formatTime(item.expectedBackAt)} · {item.checkedInAt ? `back ${formatTime(item.checkedInAt)}` : "still out"}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-amber-main/10 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-main">
                {formatDuration(item.minutesLate)} late
              </span>
            </li>
          ))}
        </ul>
      )}
    </BentoCard>
  );
}
