import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getAttendanceDevices, getAttendanceSyncFailures } from "@/lib/api/attendance";
import { formatTimestamp } from "@/lib/audit-format";
import { formatNumber, humanizeEnum } from "@/lib/format";

/** The biometric devices the clock-in/out application reads from, and anything that failed to sync. */
export default async function BackOfficeDevicesPage() {
  await requirePermission("biometric:device:manage");

  let devices: Awaited<ReturnType<typeof getAttendanceDevices>>;
  let failures: Awaited<ReturnType<typeof getAttendanceSyncFailures>>;
  try {
    [devices, failures] = await Promise.all([getAttendanceDevices(), getAttendanceSyncFailures()]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Devices"
        subject="The device list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const online = devices.filter((device) => device.online).length;

  return (
    <>
      <PageHeader title="Devices" description="Biometric devices and their sync status." />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Devices" value={formatNumber(devices.length)} icon="fingerprint" tone="primary" />
        <MetricCard label="Online" value={formatNumber(online)} icon="wifi" tone="primary" hint="Synced in the last few minutes" />
        <MetricCard label="Sync Failures" value={formatNumber(failures.length)} icon="sync_problem" tone={failures.length > 0 ? "error" : "primary"} />
      </div>

      <BentoCard className="mt-gutter" title="Registered Devices">
        {devices.length === 0 ? (
          <EmptyState symbol="fingerprint" title="No devices registered yet" />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Branch</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Serial</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Last sync</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {devices.map((device) => (
                  <tr key={device.id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="py-3 pl-2 font-semibold">{device.branchName ?? `Branch #${device.branchId}`}</td>
                    <td className="py-3 font-mono text-xs text-on-surface-variant">{device.deviceSerial}</td>
                    <td className="py-3 text-on-surface-variant">{device.lastSyncAt ? formatTimestamp(device.lastSyncAt) : "Never"}</td>
                    <td className="py-3 pr-2 text-right">
                      <span className="inline-flex items-center gap-2 text-xs font-medium">
                        <span className={`size-2 rounded-full ${device.online ? "bg-tertiary-container" : "bg-error"}`} />
                        {device.online ? "Online" : "Offline"} · {humanizeEnum(device.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>
    </>
  );
}