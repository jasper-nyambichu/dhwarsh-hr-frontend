//src/app/%28portal%29/hr/biometric/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { Icon } from "@/components/ui/icon";
import {
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  humanizeEnum,
  initials,
} from "@/lib/format";

/**
 * Biometric enrolment — bind employee fingerprints to the attendance devices.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER. Both constants are shaped like the responses they will
 * come from, but neither endpoint exists on the Spring side yet. When they
 * land, replace them with `await api.get<BiometricEnrolment[]>("/biometric/enrolments")`
 * and `await api.get<BiometricDevice[]>("/biometric/devices")` — every value
 * below is rendered from these two arrays, so nothing else in this file moves.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The enrolment panel's search and the Filter button are inert. Employee
 * lookup needs a client component against a real endpoint; this ships the
 * layout so the interaction can be dropped in without a redesign.
 *
 * "View All Devices" is a button, not a link: device management lives at
 * /admin/devices behind `biometric:device:manage`, which HR_MANAGER does not
 * hold — routing them there would only bounce them back to /hr/dashboard.
 * Point it at an HR-scoped device route when one exists.
 */

type EnrolmentStatus = "ENROLLED" | "INCOMPLETE";

type EnrolmentRow = {
  id: number;
  employeeId: number;
  name: string;
  employeeNumber: string;
  device: string;
  /** Fingers captured. The devices bank two per employee. */
  fingers: number;
  lastSync: string;
  status: EnrolmentStatus;
};

const ENROLMENTS: readonly EnrolmentRow[] = [
  { id: 1, employeeId: 1, name: "Peter Kamau", employeeNumber: "EMP-00412", device: "Nairobi CBD — Front", fingers: 2, lastSync: "2026-08-08T08:30:00", status: "ENROLLED" },
  { id: 2, employeeId: 2, name: "Sarah Ochieng", employeeNumber: "EMP-00518", device: "Mombasa Port", fingers: 1, lastSync: "2026-08-07T17:15:00", status: "INCOMPLETE" },
  { id: 3, employeeId: 3, name: "David Mutua", employeeNumber: "EMP-00327", device: "Kisumu Industrial", fingers: 2, lastSync: "2026-08-08T07:55:00", status: "ENROLLED" },
  { id: 4, employeeId: 4, name: "Alice Wanjiru", employeeNumber: "EMP-00109", device: "Thika Road", fingers: 2, lastSync: "2026-08-04T09:00:00", status: "ENROLLED" },
];

const STATUS_CHIP: Record<EnrolmentStatus, string> = {
  ENROLLED: "bg-tertiary/10 text-tertiary",
  INCOMPLETE: "bg-amber-main/10 text-amber-main",
};

/** Fingers the devices expect per employee. Below this, enrolment is partial. */
const REQUIRED_FINGERS = 2;

type DeviceRow = {
  id: number;
  name: string;
  serial: string;
  lastSeen: string;
  online: boolean;
};

const DEVICES: readonly DeviceRow[] = [
  { id: 1, name: "Nairobi CBD — Front", serial: "DH-BIO-001", lastSeen: "2026-08-08T09:58:00", online: true },
  { id: 2, name: "Mombasa Port", serial: "DH-BIO-004", lastSeen: "2026-08-08T10:00:00", online: true },
  { id: 3, name: "Kisumu Industrial", serial: "DH-BIO-012", lastSeen: "2026-08-08T09:15:00", online: false },
  { id: 4, name: "Thika Road", serial: "DH-BIO-008", lastSeen: "2026-08-08T09:48:00", online: true },
];

export default async function BiometricPage() {
  await requirePermission("biometric:read");

  const enrolled = ENROLMENTS.filter((row) => row.status === "ENROLLED").length;
  const incomplete = ENROLMENTS.length - enrolled;
  const offline = DEVICES.filter((device) => !device.online).length;

  return (
    <>
      <PageHeader
        title="Biometric Enrolment"
        description="Manage fingerprint enrolment and device health."
        pill={<CountPill label={`${enrolled} Enrolled`} />}
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ─────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard bodyClassName="flex flex-col items-center py-8">
            <span
              aria-hidden
              className="mb-6 flex size-24 items-center justify-center rounded-full bg-primary-container/10"
            >
              <Icon
                name="fingerprint"
                filled
                className="text-[48px] text-primary-container"
              />
            </span>

            <h2 className="font-page-title text-page-title text-on-surface">
              New Enrolment
            </h2>
            <p className="mt-2 max-w-md text-center font-body-md text-body-md text-on-surface-variant">
              Scan new employee fingerprints to bind them to the biometric
              attendance system.
            </p>

            <div className="mt-8 flex w-full max-w-md flex-wrap gap-3">
              <div className="relative min-w-0 flex-1">
                <Icon
                  name="badge"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant"
                />
                <input
                  type="text"
                  aria-label="Search employee to enrol"
                  placeholder="Search employee to enrol"
                  className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 pl-10 pr-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20"
                />
              </div>

              <button
                type="button"
                className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body-md text-body-md font-bold text-on-primary transition-colors hover:bg-on-primary-fixed-variant"
              >
                Start Enrolment
                <Icon name="arrow_forward" className="text-[18px]" />
              </button>
            </div>
          </BentoCard>

          <BentoCard
            title="Enrolled Employees"
            subtitle={`${formatNumber(ENROLMENTS.length)} shown · ${formatNumber(incomplete)} incomplete`}
            action={
              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-outline-variant/40 px-3 py-1.5 font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                <Icon name="filter_list" className="text-sm" />
                Filter
              </button>
            }
          >
            {ENROLMENTS.length === 0 ? (
              <p className="py-10 text-center font-body-md text-body-md text-outline">
                No employees have been enrolled yet.
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="data-table w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">
                        Employee
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Device
                      </th>
                      <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">
                        Fingers
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Last Sync
                      </th>
                      <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="font-body-md text-body-md">
                    {ENROLMENTS.map((row) => (
                      <tr key={row.id} className="group transition-colors">
                        <td className="py-3 pl-2">
                          <Link
                            href={`/hr/employees/${row.employeeId}`}
                            className="flex items-center gap-3"
                          >
                            <span
                              aria-hidden
                              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-[10px] font-bold text-primary-container"
                            >
                              {initials(row.name)}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-medium text-on-surface group-hover:text-primary-container">
                                {row.name}
                              </span>
                              <span className="block text-[10px] text-outline">
                                {row.employeeNumber}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 text-on-surface-variant">
                          {row.device}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={
                              row.fingers < REQUIRED_FINGERS
                                ? "font-semibold tabular-nums text-amber-main"
                                : "font-semibold tabular-nums text-on-surface"
                            }
                          >
                            {formatNumber(row.fingers)}
                          </span>
                          <span className="text-[10px] text-outline">
                            {" / "}
                            {REQUIRED_FINGERS}
                          </span>
                        </td>
                        <td className="py-3 tabular-nums text-on-surface-variant">
                          {formatDateTime(row.lastSync)}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[row.status]}`}
                          >
                            {humanizeEnum(row.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        </div>

        {/* ────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <SegmentStrip
            segments={[
              { label: "Enrolled", value: formatNumber(enrolled) },
              {
                label: "Incomplete",
                value: formatNumber(incomplete),
                tone: incomplete > 0 ? "warning" : "default",
              },
              {
                label: "Offline",
                value: formatNumber(offline),
                tone: offline > 0 ? "error" : "default",
              },
            ]}
          />

          <BentoCard
            title="Device Health"
            subtitle={`${formatNumber(DEVICES.length - offline)} of ${formatNumber(DEVICES.length)} online`}
            action={
              <button
                type="button"
                aria-label="Resync devices"
                className="flex size-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                <Icon name="sync" className="text-sm" />
              </button>
            }
          >
            <ul className="flex flex-col gap-3">
              {DEVICES.map((device) => (
                <li
                  key={device.id}
                  className={`flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors ${
                    device.online
                      ? "border-outline-variant/40 bg-surface hover:bg-surface-container-low"
                      : "border-error-container bg-error-container/10 hover:bg-error-container/20"
                  }`}
                >
                  <span className="flex min-w-0 gap-3">
                    <span
                      aria-hidden
                      className={`mt-1 size-2.5 shrink-0 rounded-full ${
                        device.online
                          ? "bg-tertiary ring-2 ring-tertiary/20"
                          : "bg-error ring-2 ring-error/20"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold text-on-surface">
                        {device.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-on-surface-variant">
                        {device.serial}
                      </span>
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span
                      className={`block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        device.online
                          ? "bg-tertiary/10 text-tertiary"
                          : "bg-error/10 text-error"
                      }`}
                    >
                      {device.online ? "Online" : "Offline"}
                    </span>
                    <span className="mt-1 block text-[10px] text-on-surface-variant">
                      {formatRelativeTime(device.lastSeen)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-transparent py-2 font-body-md text-body-md font-semibold text-primary-container transition-colors hover:border-primary-container/20 hover:bg-primary-container/10"
            >
              View All Devices
            </button>
          </BentoCard>
        </div>
      </div>
    </>
  );
}
