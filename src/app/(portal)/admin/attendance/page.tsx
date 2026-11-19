import Link from "next/link";
import { redirect } from "next/navigation";

import { Icon } from "@/components/ui/icon";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AttendanceFilters } from "@/components/features/attendance/attendance-filters";
import {
  AttendanceStatisticCard,
  AttendanceTiles,
  BranchStandingsCard,
  LatestScanCard,
  TerminalsBanner,
} from "@/components/features/attendance/attendance-panels";
import { LiveActivityCard } from "@/components/features/attendance/live-attendance-board";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { getAttendanceActivity, getAttendanceSummary } from "@/lib/api/attendance";
import { formatPercent } from "@/lib/format";
import { first, parseDate } from "@/lib/search-params";

/**
 * Company-wide attendance for SUPER_ADMIN and ADMIN: how the day is going, and a row per branch.
 * Employees are only ever listed inside the branch they belong to, on the branch's own page.
 *
 * Read-only by design: an admin console that silently wrote attendance rows would be a second
 * source of truth for the same table. Today's figures poll every 15 seconds; a past day is final.
 */
export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; date?: string }>;
}) {
  await requirePermission("attendance:read");

  const params = await searchParams;
  const date = parseDate(first(params.date));
  const oldBranchLink = first(params.branchId);

  // Links written before attendance moved inside each branch.
  if (oldBranchLink && /^\d+$/.test(oldBranchLink)) {
    redirect(`/admin/attendance/branches/${oldBranchLink}${date ? `?date=${date}` : ""}`);
  }

  let snapshot: { summary: Awaited<ReturnType<typeof getAttendanceSummary>>; activity: Awaited<ReturnType<typeof getAttendanceActivity>>; fetchedAt: string };
  let today: string;
  try {
    const [summary, activity, todaySummary] = await Promise.all([
      getAttendanceSummary({ date }),
      getAttendanceActivity({ limit: 50 }),
      date ? getAttendanceSummary() : null,
    ]);
    snapshot = { summary, activity, fetchedAt: summary.generatedAt };
    today = (todaySummary ?? summary).date;
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");
    return <DataUnavailable title="Attendance" subject="Attendance" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const live = snapshot.summary.date === today;
  const rate = snapshot.summary.attendanceRatePercent;

  return (
    <>
      <PageHeader
        title="Attendance"
        description="How each branch is doing. Open a branch to see its employees."
        pill={<CountPill label={`${formatPercent(rate)} reported`} tone={rate >= 85 ? "success" : rate > 0 ? "warning" : "neutral"} />}
        actions={
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <AttendanceFilters branches={[]} date={snapshot.summary.date} showBranch={false} clearable={!live} />
            <Link
              href="/admin/attendance/records"
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low sm:w-auto"
            >
              <Icon name="fact_check" className="text-[18px]" />
              Attendance records
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-gutter lg:col-span-7">
          <LatestScanCard initialSnapshot={snapshot} live={live} />
          <BranchStandingsCard initialSnapshot={snapshot} live={live} date={live ? undefined : snapshot.summary.date} />
          {live ? <LiveActivityCard initialSnapshot={snapshot} /> : null}
        </div>

        <div className="flex min-w-0 flex-col gap-gutter lg:col-span-5">
          <AttendanceStatisticCard initialSnapshot={snapshot} live={live} />
          <AttendanceTiles initialSnapshot={snapshot} live={live} />
          <TerminalsBanner initialSnapshot={snapshot} live={live} />
        </div>
      </div>
    </>
  );
}
