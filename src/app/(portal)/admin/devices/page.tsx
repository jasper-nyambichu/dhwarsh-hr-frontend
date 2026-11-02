import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { deactivateDeviceAction } from "@/app/actions/device";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import {
  getAttendanceDevices,
  getAttendanceSyncFailures,
} from "@/lib/api/attendance";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import type { AttendanceDeviceItem, AttendanceSyncFailure } from "@/types";

/**
 * Biometric terminal fleet.
 *
 * Fully wired: `GET /attendance/dashboard/devices` for the fleet and
 * `GET /attendance/dashboard/sync-failures` for the refusal feed. `online` is
 * computed server-side against a 5-minute freshness window, so liveness is a
 * measurement rather than a stored flag.
 *
 * Device identity is the serial, which is what the terminal itself sends:
 * `biometric_devices` stores no name, IP address or firmware version.
 *
 * Search is a plain GET form rather than a client-side filter: it works without
 * JavaScript, the query lands in the URL so a filtered fleet is shareable, and
 * it needs no client boundary.
 */

/** A terminal is one of three things, all derived from two real fields. */
type FleetState = "online" | "stale" | "inactive";

function fleetState(device: AttendanceDeviceItem): FleetState {
  if (device.status !== "ACTIVE") return "inactive";
  return device.online ? "online" : "stale";
}

const STATE_META: Record<FleetState, { label: string; dot: string }> = {
  online: { label: "Online", dot: "bg-emerald-500" },
  stale: { label: "Not reporting", dot: "bg-red-500" },
  inactive: { label: "Deactivated", dot: "bg-slate-400" },
};

export default async function BiometricDevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("biometric:device:manage");

  const { q } = await searchParams;
  const needle = q?.trim().toLowerCase() ?? "";

  let devices: AttendanceDeviceItem[];
  let failures: AttendanceSyncFailure[];

  try {
    [devices, failures] = await Promise.all([
      getAttendanceDevices(),
      getAttendanceSyncFailures(),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");

    return (
      <DataUnavailable
        title="Biometric Devices"
        description="Monitor and manage attendance terminal connectivity."
        subject="The device fleet"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const rows = needle
    ? devices.filter((device) =>
        [device.deviceSerial, device.branchName]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(needle)),
      )
    : devices;

  const counts: Record<FleetState, number> = {
    online: devices.filter((d) => fleetState(d) === "online").length,
    stale: devices.filter((d) => fleetState(d) === "stale").length,
    inactive: devices.filter((d) => fleetState(d) === "inactive").length,
  };

  return (
    <>
      <PageHeader
        title="Biometric Devices"
        description="Monitor and manage attendance terminal connectivity."
        actions={
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant"
          >
            <Icon name="add" className="text-[18px]" />
            Register Device
          </button>
        }
      />

      <div className="flex flex-col gap-gutter">
        <div className="grid grid-cols-2 gap-gutter lg:grid-cols-4">
          <MetricCard label="Terminals" value={formatNumber(devices.length)} icon="fingerprint" />
          <MetricCard label="Online" value={formatNumber(counts.online)} icon="wifi" tone="tertiary" />
          <MetricCard label="Not reporting" value={formatNumber(counts.stale)} icon="wifi_off" tone="error" accent={counts.stale > 0} />
          <MetricCard label="Deactivated" value={formatNumber(counts.inactive)} icon="power_settings_new" tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
          <BentoCard
            className="xl:col-span-8"
            title="Registered Terminals"
            subtitle={`${formatNumber(rows.length)} ${rows.length === 1 ? "terminal" : "terminals"}${needle ? ` matching “${q}”` : ""}`}
          >
            <form action="/admin/devices" method="get" className="mb-4 flex min-w-0 items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline"
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search serial or branch..."
                  aria-label="Search terminals"
                  className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              {needle ? (
                <a href="/admin/devices" className="shrink-0 text-sm text-on-surface-variant hover:text-primary">
                  Clear
                </a>
              ) : null}
            </form>

            {rows.length === 0 ? (
              <EmptyState
                symbol="devices_other"
                title={devices.length === 0 ? "No terminals registered" : "No terminals match that search"}
                description={
                  devices.length === 0
                    ? "Biometric terminals appear here once enrolled to a branch."
                    : "Try a different serial or branch name, or clear the search."
                }
              />
            ) : (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {rows.map((device) => {
                  const meta = STATE_META[fleetState(device)];

                  return (
                    <li key={device.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-outline-variant/40 p-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon name="fingerprint" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="break-all font-mono text-sm font-semibold text-on-surface">{device.deviceSerial}</p>
                          <p className="break-words text-xs text-on-surface-variant">{device.branchName ?? "No branch"}</p>
                        </div>
                        {device.status === "ACTIVE" ? (
                          <ConfirmDeleteButton
                            compact
                            action={deactivateDeviceAction}
                            id={device.id}
                            name={device.deviceSerial}
                            label="Deactivate"
                            title="Deactivate this terminal?"
                            confirmText="It will stop recording clock-ins."
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-medium text-on-surface-variant">
                          <span className={`inline-block size-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <span className={device.lastSyncAt ? "text-on-surface-variant" : "text-error"}>
                          {device.lastSyncAt ? `Synced ${formatRelativeTime(device.lastSyncAt)}` : "Never synced"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </BentoCard>

          <BentoCard
            className="xl:col-span-4"
            title="Recent Sync Failures"
            subtitle="Scans the backend refused. No attendance was recorded for them."
          >
            {failures.length === 0 ? (
              <EmptyState symbol="task_alt" title="No rejected scans" description="Every recent scan was accepted." />
            ) : (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
                {failures.slice(0, 6).map((failure) => (
                  <li key={failure.id} className="flex min-w-0 flex-col gap-1 rounded-lg border border-red-100 bg-red-50/50 p-3">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <span className="min-w-0 break-all font-mono text-[11px] font-semibold text-on-surface">
                        {failure.deviceSerial ?? "Unknown terminal"}
                      </span>
                      <span className="shrink-0 text-[10px] text-on-surface-variant">
                        {formatRelativeTime(failure.createdAt)}
                      </span>
                    </div>
                    <span className="break-words text-xs text-error">{failure.reason}</span>
                    {failure.employeeName ? (
                      <span className="break-words text-[10px] text-on-surface-variant">{failure.employeeName}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </BentoCard>
        </div>
      </div>
    </>
  );
}
