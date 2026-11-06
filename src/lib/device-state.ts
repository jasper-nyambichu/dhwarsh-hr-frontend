import { formatRelativeTime } from "@/lib/format";
import type { AttendanceDeviceItem } from "@/types";

/**
 * What a branch PC and its fingerprint reader are doing, from the PC's last report. Each PC reports every
 * minute, and at once when its reader is plugged in or out. An older app never reports, so for it only a
 * recent scan counts as online and nothing is known about the reader.
 */
export type DeviceState = "online" | "reader_unplugged" | "offline" | "inactive";

export const DEVICE_STATE_META: Record<DeviceState, { label: string; dot: string; text: string }> = {
  online: { label: "Online", dot: "bg-emerald-500", text: "text-on-surface-variant" },
  reader_unplugged: { label: "Reader not detected", dot: "bg-amber-500", text: "text-amber-700" },
  offline: { label: "PC offline", dot: "bg-red-500", text: "text-error" },
  inactive: { label: "Deactivated", dot: "bg-slate-400", text: "text-on-surface-variant" },
};

export function deviceState(device: AttendanceDeviceItem): DeviceState {
  if (device.status !== "ACTIVE") return "inactive";
  if (!device.online) return "offline";
  return device.readerConnected === false ? "reader_unplugged" : "online";
}

/** One line under the status: how long the reader has been out, when the PC last reported, scans it holds. */
export function deviceDetail(device: AttendanceDeviceItem): string {
  const state = deviceState(device);
  const parts: string[] = [];

  if (state === "reader_unplugged" && device.readerChangedAt) {
    parts.push(`Unplugged ${formatRelativeTime(device.readerChangedAt)}`);
  }
  if (device.lastSeenAt) {
    parts.push(`PC seen ${formatRelativeTime(device.lastSeenAt)}`);
  } else if (device.lastSyncAt) {
    parts.push(`Last scan ${formatRelativeTime(device.lastSyncAt)}`);
  } else {
    parts.push("Never reported");
  }
  if (device.pendingScans && device.pendingScans > 0) {
    parts.push(`${device.pendingScans} scan${device.pendingScans === 1 ? "" : "s"} waiting to send`);
  }
  if (device.appVersion) parts.push(`App ${device.appVersion}`);

  return parts.join(" · ");
}
