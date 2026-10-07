import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
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
 * Three columns the placeholder showed have no column behind them and are gone:
 * device **name** (`biometric_devices` has only a serial), **IP address** and
 * **firmware version** (neither is stored). Device identity here is the serial,
 * which is what the terminal itself sends.
 *
 * The status vocabulary also shrank from three to two: the backend has no
 * `SYNCING` state — a terminal is `ACTIVE` or `INACTIVE`, and separately it is
 * inside or outside the freshness window. A "syncing" bucket would have been a
 * third thing that never occurs.
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

const STATE_META: Record<FleetState, { label: string; dot: string; bar: string }> = {
  online: { label: "Online", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  stale: { label: "Not reporting", dot: "bg-red-500", bar: "bg-red-500" },
  inactive: { label: "Deactivated", dot: "bg-slate-400", bar: "bg-slate-400" },
};

const STATE_ORDER: FleetState[] = ["online", "stale", "inactive"];

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
  const fleetTotal = devices.length || 1;

  return (
    <>
      <PageHeader
        title="Biometric Devices"
        description="Monitor and manage attendance terminal connectivity."
        actions={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant"
          >
            <Icon name="add" className="text-[18px]" />
            Register Device
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ─────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon
                  name="dns"
                  className="text-[18px] text-on-surface-variant"
                />
                Registered Terminals
              </span>
            }
            action={
              <form action="/admin/devices" method="get">
                <div className="relative">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline"
                  />
                  <input
                    type="search"
                    name="q"
                    defaultValue={q ?? ""}
                    placeholder="Search serial or branch..."
                    className="w-64 rounded-md border border-outline-variant/60 bg-surface py-1.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </form>
            }
          >
            {rows.length === 0 ? (
              <EmptyState
                symbol="devices_other"
                title={
                  devices.length === 0
                    ? "No terminals registered"
                    : "No terminals match that search"
                }
                description={
                  devices.length === 0
                    ? "Biometric terminals appear here once enrolled to a branch."
                    : "Try a different serial or branch name, or clear the search."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/60 text-on-surface-variant">
                      <th className="px-4 py-3 font-table-header text-table-header uppercase">
                        Terminal
                      </th>
                      <th className="px-4 py-3 font-table-header text-table-header uppercase">
                        Branch
                      </th>
                      <th className="px-4 py-3 font-table-header text-table-header uppercase">
                        Last Sync
                      </th>
                      <th className="px-4 py-3 font-table-header text-table-header uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((device) => {
                      const state = fleetState(device);
                      const meta = STATE_META[state];

                      return (
                        <tr
                          key={device.id}
                          className="border-b border-outline-variant/60 transition-colors last:border-0 hover:bg-surface"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 items-center justify-center rounded bg-primary/10 text-primary">
                                <Icon name="fingerprint" className="text-[18px]" />
                              </div>
                              <div>
                                <div className="font-mono text-sm font-semibold text-on-surface">
                                  {device.deviceSerial}
                                </div>
                                <div className="text-[10px] text-outline">
                                  Terminal #{device.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {device.branchName ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant">
                            {device.lastSyncAt ? (
                              formatRelativeTime(device.lastSyncAt)
                            ) : (
                              <span className="text-error">Never synced</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
                              <span
                                className={`inline-block size-2 rounded-full ${meta.dot}`}
                              />
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-outline-variant/60 pt-4 text-xs text-on-surface-variant">
              <span>
                {formatNumber(rows.length)}{" "}
                {rows.length === 1 ? "terminal" : "terminals"}
                {needle ? ` matching “${q}”` : ""}
              </span>
              {needle ? (
                <a href="/admin/devices" className="hover:text-primary">
                  Clear search
                </a>
              ) : null}
            </div>
          </BentoCard>
        </div>

        {/* ────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title="Fleet Status Overview">
            {devices.length === 0 ? (
              <p className="py-4 text-center font-body-md text-body-md text-outline">
                No terminals enrolled.
              </p>
            ) : (
              <>
                <div className="mb-2 flex gap-0.5 overflow-hidden rounded-full">
                  {STATE_ORDER.map((state) => (
                    <div
                      key={state}
                      className={`h-2 ${STATE_META[state].bar}`}
                      style={{ width: `${(counts[state] / fleetTotal) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
                  {STATE_ORDER.map((state) => (
                    <div key={state} className="flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${STATE_META[state].dot}`}
                      />
                      <span className="text-on-surface-variant">
                        {STATE_META[state].label} ({formatNumber(counts[state])})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2 text-error">
                <Icon name="sync_problem" className="text-[18px]" />
                Recent Sync Failures
              </span>
            }
            subtitle={
              failures.length > 0
                ? "Scans the backend refused — no attendance row was written."
                : undefined
            }
            flush
          >
            <div className="flex flex-col gap-3 p-card-padding pt-0">
              {failures.length === 0 ? (
                <p className="py-4 text-center font-body-md text-body-md text-outline">
                  No rejected scans.
                </p>
              ) : (
                failures.slice(0, 6).map((failure) => (
                  <div
                    key={failure.id}
                    className="flex flex-col gap-1 rounded-lg border border-red-100 bg-red-50/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate font-mono text-[11px] font-semibold text-on-surface">
                        {failure.deviceSerial ?? "Unknown terminal"}
                      </span>
                      <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] text-on-surface-variant shadow-sm">
                        {formatRelativeTime(failure.createdAt)}
                      </span>
                    </div>
                    <span className="text-xs text-error">{failure.reason}</span>
                    {failure.employeeName ? (
                      <span className="text-[10px] text-on-surface-variant">
                        {failure.employeeName}
                      </span>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}
