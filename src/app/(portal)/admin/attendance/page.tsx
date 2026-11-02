import { redirect } from "next/navigation";

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
        actions={<AttendanceFilters branches={[]} date={snapshot.summary.date} showBranch={false} clearable={!live} />}
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
