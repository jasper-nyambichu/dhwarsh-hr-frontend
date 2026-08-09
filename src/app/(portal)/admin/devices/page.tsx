//src/app/(portal)/admin/devices/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatNumber } from "@/lib/format";

/**
 * Biometric device fleet directory.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.BiometricDevice`. Sync
 * failures are a separate feed the backend will need to expose (e.g. a
 * `device_sync_events` table filtered to failures/warnings).
 * ─────────────────────────────────────────────────────────────────────────
 */

type DeviceStatus = "ONLINE" | "OFFLINE" | "SYNCING";

type DeviceRow = {
  id: number;
  name: string;
  serial: string;
  branch: string;
  ip: string;
  firmware: string;
  lastSync: string;
  lastSyncUrgent: boolean;
  status: DeviceStatus;
  icon: string;
};

type SyncFailure = {
  id: number;
  deviceName: string;
  time: string;
  message: string;
  severity: "error" | "warning";
};

const DEVICES: readonly DeviceRow[] = [
  { id: 1, name: "HQ Main Entrance", serial: "ZK-889021A", branch: "Nairobi HQ", ip: "192.168.1.105", firmware: "v2.4.1", lastSync: "2 mins ago", lastSyncUrgent: false, status: "ONLINE", icon: "fingerprint" },
  { id: 2, name: "Mombasa Factory Gate", serial: "ZK-77412B", branch: "Mombasa Branch", ip: "10.0.5.22", firmware: "v2.3.9", lastSync: "4 hours ago", lastSyncUrgent: true, status: "OFFLINE", icon: "co_present" },
  { id: 3, name: "Kisumu Office Front", serial: "HI-99234X", branch: "Kisumu Branch", ip: "192.168.2.50", firmware: "v1.8.0", lastSync: "Syncing...", lastSyncUrgent: false, status: "SYNCING", icon: "fingerprint" },
  { id: 4, name: "HQ IT Dept", serial: "FR-11099Z", branch: "Nairobi HQ", ip: "192.168.1.106", firmware: "v3.1.0", lastSync: "5 mins ago", lastSyncUrgent: false, status: "ONLINE", icon: "face" },
  { id: 5, name: "Nakuru Warehouse", serial: "ZK-44512C", branch: "Nakuru Branch", ip: "10.0.3.15", firmware: "v2.4.1", lastSync: "12 mins ago", lastSyncUrgent: false, status: "ONLINE", icon: "fingerprint" },
  { id: 6, name: "Eldoret Store", serial: "ZK-22341D", branch: "Eldoret Branch", ip: "10.0.4.88", firmware: "v2.3.5", lastSync: "Yesterday", lastSyncUrgent: true, status: "OFFLINE", icon: "fingerprint" },
];

const SYNC_FAILURES: readonly SyncFailure[] = [
  { id: 1, deviceName: "Mombasa Factory Gate", time: "10:45 AM", message: "Connection Timeout (Code: 10060)", severity: "error" },
  { id: 2, deviceName: "Eldoret Store", time: "08:12 AM", message: "Device Unreachable (Ping Fail)", severity: "error" },
  { id: 3, deviceName: "Kisumu Office Front", time: "Yesterday", message: "Partial Sync (Logs missing)", severity: "warning" },
];

const STATUS_META: Record<DeviceStatus, { label: string; dot: string; badge: string }> = {
  ONLINE: { label: "Online", dot: "bg-emerald-500", badge: "border border-green-200 bg-green-50 text-green-700" },
  OFFLINE: { label: "Offline", dot: "bg-red-500", badge: "border border-red-200 bg-red-50 text-red-700" },
  SYNCING: { label: "Syncing", dot: "bg-amber-500", badge: "border border-amber-200 bg-amber-50 text-amber-700" },
};

export default async function BiometricDevicesPage() {
  await requirePermission("biometric:device:manage");

  const onlineCount = DEVICES.filter((d) => d.status === "ONLINE").length;
  const syncingCount = DEVICES.filter((d) => d.status === "SYNCING").length;
  const offlineCount = DEVICES.filter((d) => d.status === "OFFLINE").length;
  const fleetTotal = onlineCount + syncingCount + offlineCount;

  return (
    <>
      <PageHeader
        title="Biometric Devices"
        description="Monitor and manage attendance terminal connectivity."
        actions={
          <Link
            href="/admin/devices/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant"
          >
            <Icon name="add" className="text-[18px]" />
            Register Device
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ─────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="dns" className="text-[18px] text-on-surface-variant" />
                Registered Terminals
              </span>
            }
            action={
              <div className="flex gap-2">
                <div className="relative">
                  <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline" />
                  <input
                    type="text"
                    placeholder="Search devices..."
                    className="w-64 rounded-md border border-outline-variant/60 bg-surface py-1.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <button className="flex items-center justify-center rounded-md border border-outline-variant/60 p-1.5 text-on-surface-variant transition-colors hover:bg-surface">
                  <Icon name="filter_list" className="text-[18px]" />
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/60 text-on-surface-variant">
                    <th className="px-4 py-3 font-table-header text-table-header uppercase">Device</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase">Branch</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase">Network</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase">Last Sync</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase">Status</th>
                    <th className="px-4 py-3 text-right font-table-header text-table-header uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {DEVICES.map((device) => {
                    const meta = STATUS_META[device.status];
                    return (
                      <tr key={device.id} className="group border-b border-outline-variant/60 transition-colors last:border-0 hover:bg-surface">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded bg-primary/10 text-primary">
                              <Icon name={device.icon} className="text-[18px]" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-on-surface">{device.name}</div>
                              <div className="text-[10px] text-outline">SN: {device.serial}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{device.branch}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{device.ip}</div>
                          <div className="text-[10px] text-outline">Firmware: {device.firmware}</div>
                        </td>
                        <td className={`px-4 py-3 text-sm ${device.lastSyncUrgent ? "text-error" : "text-on-surface-variant"}`}>
                          {device.lastSync}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.badge}`}>
                            <span className={`inline-block size-2 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1 text-outline opacity-0 transition-colors group-hover:opacity-100 hover:text-primary">
                            <Icon name="more_vert" className="text-[18px]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-outline-variant/60 pt-4 text-xs text-on-surface-variant">
              <span>Showing {DEVICES.length} of 24 devices</span>
              <div className="flex gap-1">
                <button className="rounded border border-transparent px-2 py-1 hover:border-outline-variant/60 hover:bg-surface">Prev</button>
                <button className="rounded bg-primary px-2 py-1 text-white">1</button>
                <button className="rounded border border-transparent px-2 py-1 hover:border-outline-variant/60 hover:bg-surface">2</button>
                <button className="rounded border border-transparent px-2 py-1 hover:border-outline-variant/60 hover:bg-surface">3</button>
                <button className="rounded border border-transparent px-2 py-1 hover:border-outline-variant/60 hover:bg-surface">Next</button>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* ────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title="Fleet Status Overview">
            <div className="mb-2 flex gap-0.5 overflow-hidden rounded-full">
              <div className="h-2 bg-emerald-500" style={{ width: `${(onlineCount / fleetTotal) * 100}%` }} />
              <div className="h-2 bg-amber-500" style={{ width: `${(syncingCount / fleetTotal) * 100}%` }} />
              <div className="h-2 bg-red-500" style={{ width: `${(offlineCount / fleetTotal) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-on-surface-variant">Online ({formatNumber(onlineCount)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                <span className="text-on-surface-variant">Syncing ({formatNumber(syncingCount)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-500" />
                <span className="text-on-surface-variant">Offline ({formatNumber(offlineCount)})</span>
              </div>
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2 text-error">
                <Icon name="sync_problem" className="text-[18px]" />
                Recent Sync Failures
              </span>
            }
            flush
          >
            <div className="flex flex-col gap-3 p-card-padding pt-0">
              {SYNC_FAILURES.map((failure) => (
                <div
                  key={failure.id}
                  className={`flex flex-col gap-1 rounded-lg border p-3 ${
                    failure.severity === "error" ? "border-red-100 bg-red-50/50" : "border-amber-100 bg-amber-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-semibold text-on-surface">{failure.deviceName}</span>
                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-on-surface-variant shadow-sm">
                      {failure.time}
                    </span>
                  </div>
                  <span className={`text-xs ${failure.severity === "error" ? "text-error" : "text-amber-700"}`}>
                    {failure.message}
                  </span>
                  <button className="mt-1 flex w-fit items-center gap-1 text-[10px] font-medium text-primary hover:underline">
                    <Icon name="refresh" className="text-[12px]" />
                    Retry Sync
                  </button>
                </div>
              ))}
              <button className="mt-1 w-full rounded-lg bg-[#E6F0F8] py-2 text-sm font-semibold text-[#1C6EB4] transition-colors hover:bg-[#d0e4ff]">
                Run Global Diagnostic
              </button>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}