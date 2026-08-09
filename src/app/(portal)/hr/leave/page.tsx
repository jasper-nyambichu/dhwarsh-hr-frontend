import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { Icon } from "@/components/ui/icon";
import { formatDate, formatNumber, initials } from "@/lib/format";
import type { LeaveRequest, LeaveStatus } from "@/types";

/**
 * Leave requests queue.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.LeaveRequest`. Swap for
 * `await api.get<Paginated<LeaveRequest>>("/leave/pending/hr")` (or the
 * matching status endpoint) when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

const LEAVE_REQUESTS: readonly LeaveRequest[] = [
  {
    id: 1,
    employeeId: 101,
    employeeName: "Amara Kiprotich",
    leaveTypeId: 1,
    leaveTypeName: "Annual Leave",
    startDate: "2026-10-12",
    endDate: "2026-10-16",
    days: 5,
    reason: null,
    status: "PENDING_HR",
    approvedByManagerId: 22,
    approvedByHrId: null,
    rejectionReason: null,
    createdAt: null,
    updatedAt: null,
    createdBy: null,
    updatedBy: null,
  },
  {
    id: 2,
    employeeId: 102,
    employeeName: "Juma Omondi",
    leaveTypeId: 2,
    leaveTypeName: "Sick Leave",
    startDate: "2026-10-24",
    endDate: "2026-10-25",
    days: 2,
    reason: null,
    status: "PENDING",
    approvedByManagerId: null,
    approvedByHrId: null,
    rejectionReason: null,
    createdAt: null,
    updatedAt: null,
    createdBy: null,
    updatedBy: null,
  },
  {
    id: 3,
    employeeId: 103,
    employeeName: "David Mutua",
    leaveTypeId: 5,
    leaveTypeName: "Paternity Leave",
    startDate: "2026-11-01",
    endDate: "2026-11-14",
    days: 10,
    reason: null,
    status: "PENDING_HR",
    approvedByManagerId: 22,
    approvedByHrId: null,
    rejectionReason: null,
    createdAt: null,
    updatedAt: null,
    createdBy: null,
    updatedBy: null,
  },
];

const STATUS_TABS: readonly FilterTab[] = [
  { label: "Pending" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: "ALL" },
];

const STAGE_LABEL: Record<LeaveStatus, string> = {
  PENDING: "Manager",
  PENDING_HR: "HR",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const LEAVE_BY_TYPE = [
  { label: "Annual", value: 32, color: "var(--color-primary)" },
  { label: "Sick", value: 14, color: "var(--color-tertiary)" },
  { label: "Other", value: 7, color: "var(--color-surface-container-high)" },
] as const;

const LONGEST_PENDING = [
  { id: 1, name: "Wanjiku Mwangi", type: "Maternity Leave", daysWaiting: 7 },
  { id: 2, name: "Kevin Ochieng", type: "Annual Leave", daysWaiting: 5 },
] as const;

export default async function LeavePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("leave:read");
  const { status } = await searchParams;

  const rows =
    !status || status === "PENDING"
      ? LEAVE_REQUESTS.filter((r) => r.status === "PENDING" || r.status === "PENDING_HR")
      : status === "ALL"
        ? LEAVE_REQUESTS
        : LEAVE_REQUESTS.filter((r) => r.status === status);

  const pendingCount = LEAVE_REQUESTS.filter(
    (r) => r.status === "PENDING" || r.status === "PENDING_HR",
  ).length;

  return (
    <>
      <PageHeader
        title="Leave Requests"
        pill={<CountPill label={`${pendingCount} Pending`} tone="warning" />}
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <FilterTabs tabs={STATUS_TABS} active={status} param="status" basePath="/hr/leave" />

          <BentoCard
            title="Requests"
            action={
              <button
                type="button"
                className="flex items-center gap-1 font-body-md text-body-md text-primary hover:underline"
              >
                <Icon name="filter_list" className="text-[16px]" />
                Filter
              </button>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Leave Type</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">From</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">To</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Days</th>
                    <th className="pb-3 text-center font-table-header text-table-header uppercase text-outline">Stage</th>
                    <th className="pb-3 text-center font-table-header text-table-header uppercase text-outline">Status</th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {rows.map((req) => (
                    <tr key={req.id} className="group transition-colors">
                      <td className="py-3 pl-2">
                        <Link href={`/hr/leave/${req.id}`} className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-[10px] font-bold text-on-primary-container"
                          >
                            {initials(req.employeeName ?? "?")}
                          </span>
                          <span className="font-medium text-on-surface group-hover:text-primary-container">
                            {req.employeeName}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 text-on-surface-variant">{req.leaveTypeName}</td>
                      <td className="py-3 text-on-surface-variant">{formatDate(req.startDate)}</td>
                      <td className="py-3 text-on-surface-variant">{formatDate(req.endDate)}</td>
                      <td className="py-3 text-right font-medium tabular-nums text-on-surface">{req.days}</td>
                      <td className="py-3 text-center">
                        <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-semibold text-on-secondary-container">
                          {STAGE_LABEL[req.status]}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="mx-auto flex w-max items-center justify-center gap-1 rounded-full border border-outline-variant/30 bg-surface-variant px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                          <span className="size-1.5 rounded-full bg-outline" />
                          Pending
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button className="rounded border border-tertiary-container/30 bg-tertiary-container/10 p-1 text-tertiary-container transition-colors hover:bg-tertiary-container/20">
                            <Icon name="check" className="text-[16px]" />
                          </button>
                          <button className="rounded border border-error/30 bg-error/10 p-1 text-error transition-colors hover:bg-error/20">
                            <Icon name="close" className="text-[16px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <SegmentStrip
            segments={[
              { label: "Pending", value: formatNumber(pendingCount), tone: "warning" },
              { label: "Approved", value: formatNumber(42) },
              { label: "Rejected", value: formatNumber(3) },
            ]}
          />

          <BentoCard title="By Leave Type">
            <DonutChart segments={LEAVE_BY_TYPE} size={160} legend="value" centerLabel="Total" />
          </BentoCard>

          <BentoCard title="Longest Pending">
            <ul className="flex flex-col gap-4">
              {LONGEST_PENDING.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container"
                    >
                      {initials(item.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-body-md text-body-md font-medium text-on-surface">
                        {item.name}
                      </span>
                      <span className="block text-[10px] text-on-surface-variant">{item.type}</span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded bg-amber-main/10 px-2 py-1 text-[10px] font-semibold text-amber-main">
                    {item.daysWaiting} days
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/hr/leave?status=PENDING"
              className="mt-4 block rounded-lg py-2 text-center font-body-md text-body-md font-medium text-primary transition-colors hover:bg-surface-container-low"
            >
              View All Escalations
            </Link>
          </BentoCard>
        </div>
      </div>
    </>
  );
}