import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { LiveAttendanceBoard } from "@/components/features/attendance/live-attendance-board";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getAttendanceActivity, getAttendanceDevices, getAttendanceSummary } from "@/lib/api/attendance";
import { getBranches } from "@/lib/api/branch";
import { formatTimestamp } from "@/lib/audit-format";
import { parseId } from "@/lib/search-params";

/**
 * Back Office dashboard — who is clocked in right now, across every branch (or one, with
 * `?branchId=`), and whether the biometric devices feeding it are online. Updates live.
 */
export default async function BackOfficeDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  await requirePermission("attendance:read");
  const { branchId: rawBranch } = await searchParams;
  const branchId = parseId(rawBranch);

  let data: {
    summary: Awaited<ReturnType<typeof getAttendanceSummary>>;
    activity: Awaited<ReturnType<typeof getAttendanceActivity>>;
    devices: Awaited<ReturnType<typeof getAttendanceDevices>>;
    branches: Awaited<ReturnType<typeof getBranches>>;
  };

  try {
    const [summary, activity, devices, branches] = await Promise.all([
      getAttendanceSummary({ branchId }),
      getAttendanceActivity({ branchId }),
      getAttendanceDevices({ branchId }),
      getBranches(),
    ]);
    data = { summary, activity, devices, branches };
  } catch (error) {
    return (
      <DataUnavailable
        title="Dashboard"
        description="Live clock-in and clock-out activity."
        subject="The attendance dashboard"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const { summary, activity, devices, branches } = data;
  const recordsHref = branchId ? `/backoffice/attendance?branchId=${branchId}` : "/backoffice/attendance";

  return (
    <>
      <PageHeader title="Back Office" description="Clock-in and clock-out activity from the biometric devices." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/backoffice/dashboard"
          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
            !branchId ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          All branches
        </Link>
        {branches.map((branch) => (
          <Link
            key={branch.id}
            href={`/backoffice/dashboard?branchId=${branch.id}`}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              branchId === branch.id ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {branch.name}
          </Link>
        ))}
      </div>

      <LiveAttendanceBoard
        initialSnapshot={{ summary, activity, fetchedAt: summary.generatedAt }}
        branchId={branchId}
        recordsHref={recordsHref}
      />

      <BentoCard
        className="mt-gutter"
        title="Devices"
        subtitle={`${summary.devicesOnline} of ${summary.devicesTotal} online`}
        action={<Link href="/backoffice/devices" className="text-[10px] font-semibold text-primary hover:underline">View All</Link>}
      >
        {devices.length === 0 ? (
          <EmptyState symbol="fingerprint" title="No devices registered" description="Biometric events only arrive once a device is registered for the branch." />
        ) : (
          <ul className="flex flex-col divide-y divide-outline-variant/20">
            {devices.slice(0, 6).map((device) => (
              <li key={device.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${device.online ? "bg-tertiary-container" : "bg-error"}`} />
                  <span className="text-sm font-medium text-on-surface">{device.branchName ?? `Branch #${device.branchId}`}</span>
                  <span className="font-mono text-[11px] text-outline">{device.deviceSerial}</span>
                </span>
                <span className="text-xs text-on-surface-variant">{device.lastSyncAt ? `Synced ${formatTimestamp(device.lastSyncAt)}` : "Never synced"}</span>
              </li>
            ))}
          </ul>
        )}
      </BentoCard>
    </>
  );
}