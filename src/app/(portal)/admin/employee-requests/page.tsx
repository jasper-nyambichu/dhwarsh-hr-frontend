import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requireRole } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { MetricCard } from "@/components/shared/metric-card";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getEmployeeRequests } from "@/lib/api/employee-request";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  formatRelativeTime,
  humanizeEnum,
} from "@/lib/format";
import {
  EMPLOYEE_REQUEST_STATUSES,
  type EmployeeCreationRequestResponse,
  type EmployeeRequestStatus,
} from "@/types/employee-request";

/**
 * Employee approvals — the queue of new employees HR has asked for.
 *
 * Laid out like the other admin screens: page header, a row of metric tiles,
 * then a 12-column grid with the working list in the wide column and context in
 * the narrow one. Below `lg` the grid collapses to one column; below `md` the
 * list swaps its table for stacked cards, because a five-column table cannot
 * be read at 360px and horizontal scrolling hides the Review button.
 *
 * `GET /employee-requests` returns every request in one list, so the tile counts
 * and the filter are both computed here from that single read. The active tab
 * lives in the URL (`?status=`), which keeps a filtered queue shareable and lets
 * the back button step through tabs. The default tab is Pending, because that is
 * the only one that needs action.
 *
 * Deciding happens on the detail page, not here: approving writes salary and
 * statutory numbers into a new employee, so the admin should see every value
 * before the button.
 */
export default async function EmployeeRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);

  const { status: statusParam } = await searchParams;

  let requests: EmployeeCreationRequestResponse[];

  try {
    requests = await getEmployeeRequests();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="Employee approvals"
        description="New employees HR has asked to add."
        subject="The approval queue"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const active: EmployeeRequestStatus | "ALL" =
    statusParam === "ALL"
      ? "ALL"
      : (EMPLOYEE_REQUEST_STATUSES as readonly string[]).includes(statusParam ?? "")
        ? (statusParam as EmployeeRequestStatus)
        : "PENDING";

  const count = (status: EmployeeRequestStatus) =>
    requests.filter((r) => r.status === status).length;

  const pending = count("PENDING");

  // `FilterTabs` marks a tab selected when its `value` equals `active`, and the
  // "All" tab has to carry a real value (not undefined) because this page
  // defaults to Pending rather than to All.
  const tabs: FilterTab[] = [
    { label: "Pending", value: "PENDING", count: pending },
    { label: "Approved", value: "APPROVED", count: count("APPROVED") },
    { label: "Rejected", value: "REJECTED", count: count("REJECTED") },
    { label: "All", value: "ALL", count: requests.length },
  ];

  const visible =
    active === "ALL" ? requests : requests.filter((r) => r.status === active);

  // Oldest first — the one that has waited longest is the one to do next.
  const waitingLongest = requests
    .filter((r) => r.status === "PENDING")
    .sort((a, b) => (a.requestedAt ?? "").localeCompare(b.requestedAt ?? ""))
    .slice(0, 4);

  return (
    <>
      <PageHeader
        title="Employee approvals"
        description="New employees HR has asked to add. Approving a request creates the employee."
        pill={
          pending > 0 ? (
            <CountPill label={`${formatNumber(pending)} pending`} tone="warning" />
          ) : (
            <CountPill label="Queue clear" tone="success" />
          )
        }
      />

      <div className="flex flex-col gap-gutter">
        {/* ─────────────────────────────── metric tiles ────────────────── */}
        <div className="grid grid-cols-2 gap-gutter lg:grid-cols-4">
          <MetricCard
            label="Pending"
            value={formatNumber(pending)}
            icon="hourglass_top"
            tone="amber"
            accent={pending > 0}
            hint={pending > 0 ? "Waiting for your decision" : "Nothing waiting"}
          />
          <MetricCard
            label="Approved"
            value={formatNumber(count("APPROVED"))}
            icon="check_circle"
            tone="tertiary"
            hint="Employees created"
          />
          <MetricCard
            label="Rejected"
            value={formatNumber(count("REJECTED"))}
            icon="cancel"
            tone="error"
            hint="Sent back to HR"
          />
          <MetricCard
            label="All requests"
            value={formatNumber(requests.length)}
            icon="inbox"
            tone="primary"
          />
        </div>

        <div className="grid grid-cols-12 gap-gutter">
          {/* ───────────────────────────── main column ─────────────────── */}
          <div className="col-span-12 lg:col-span-8">
            <BentoCard
              title={
                <span className="flex items-center gap-2">
                  <Icon name="fact_check" className="text-[18px] text-on-surface-variant" />
                  {active === "ALL" ? "All requests" : `${humanizeEnum(active)} requests`}
                </span>
              }
              subtitle={`${formatNumber(visible.length)} ${
                visible.length === 1 ? "request" : "requests"
              }`}
              action={
                <FilterTabs tabs={tabs} active={active} param="status" basePath="/admin/employee-requests" />
              }
            >
              {visible.length === 0 ? (
                <EmptyState
                  symbol={active === "PENDING" ? "task_alt" : "inbox"}
                  title={active === "PENDING" ? "Nothing waiting" : "No requests here"}
                  description={
                    active === "PENDING"
                      ? "Every request from HR has been decided."
                      : "Requests with this status will appear here."
                  }
                />
              ) : (
                <>
                  {/* Phones: one card per request. */}
                  <ul className="flex flex-col gap-3 md:hidden">
                    {visible.map((request) => (
                      <li key={request.id}>
                        <RequestCard request={request} />
                      </li>
                    ))}
                  </ul>

                  {/* md and up: the table. */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left font-body-md text-body-md">
                      <thead>
                        <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                          <th className="pb-3 pr-4">Employee</th>
                          <th className="pb-3 pr-4">Branch</th>
                          <th className="pb-3 pr-4">Requested</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 text-right">
                            <span className="sr-only">Action</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((request) => (
                          <RequestRow key={request.id} request={request} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </BentoCard>
          </div>

          {/* ───────────────────────────── side column ─────────────────── */}
          <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
            <BentoCard
              title={
                <span className="flex items-center gap-2">
                  <Icon name="schedule" className="text-[18px] text-on-surface-variant" />
                  Waiting longest
                </span>
              }
            >
              {waitingLongest.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No pending requests. You&apos;ll be notified when HR sends a new one.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-outline-variant/25">
                  {waitingLongest.map((request) => (
                    <li key={request.id}>
                      <Link
                        href={`/admin/employee-requests/${request.id}`}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-primary"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-body-md text-body-md font-semibold text-on-surface">
                            {request.details.fullName}
                          </span>
                          <span className="block truncate text-[11px] text-outline">
                            {request.branchName ?? "—"} · {formatRelativeTime(request.requestedAt)}
                          </span>
                        </span>
                        <Icon name="chevron_right" className="shrink-0 text-[20px] text-outline" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </BentoCard>

            <BentoCard
              title={
                <span className="flex items-center gap-2">
                  <Icon name="info" className="text-[18px] text-on-surface-variant" />
                  How approvals work
                </span>
              }
              className="border border-secondary-fixed bg-surface-bright"
            >
              <ul className="flex flex-col gap-3 font-body-md text-body-md text-on-surface-variant">
                <li className="flex items-start gap-2">
                  <Icon name="check_circle" className="mt-0.5 text-[14px] text-tertiary-container" />
                  Approving creates the employee with exactly the values HR submitted.
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check_circle" className="mt-0.5 text-[14px] text-tertiary-container" />
                  Rejecting needs a reason. HR sees it next to the request.
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="check_circle" className="mt-0.5 text-[14px] text-tertiary-container" />
                  Either way, the bell notification clears and HR is told the outcome.
                </li>
              </ul>
            </BentoCard>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ parts -- */

function ReviewButton({ request }: { request: EmployeeCreationRequestResponse }) {
  const isPending = request.status === "PENDING";

  return (
    <Link
      href={`/admin/employee-requests/${request.id}`}
      className={buttonVariants({
        variant: isPending ? "primary" : "outline",
        size: "sm",
      })}
    >
      {isPending ? (
        <>
          <Icon name="fact_check" className="text-[16px]" />
          Review
        </>
      ) : (
        "View"
      )}
    </Link>
  );
}

/** One request as a table row (md and up). */
function RequestRow({ request }: { request: EmployeeCreationRequestResponse }) {
  const { details } = request;

  return (
    <tr className="border-b border-outline-variant/25 last:border-0">
      <td className="py-3 pr-4">
        <Link
          href={`/admin/employee-requests/${request.id}`}
          className="font-semibold text-on-surface hover:text-primary"
        >
          {details.fullName}
        </Link>
        <p className="text-[11px] text-outline">
          {[
            details.position,
            humanizeEnum(details.employmentType),
            details.basicSalary === null ? null : formatMoney(details.basicSalary),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </td>
      <td className="py-3 pr-4 text-on-surface-variant">
        {request.branchName ?? "—"}
        {request.departmentName ? (
          <span className="block text-[11px] text-outline">{request.departmentName}</span>
        ) : null}
      </td>
      <td className="py-3 pr-4 text-on-surface-variant">
        {formatDateTime(request.requestedAt)}
        <span className="block text-[11px] text-outline">
          by {request.requestedByName ?? "HR"}
        </span>
      </td>
      <td className="py-3 pr-4">
        <StatusBadge status={request.status} />
      </td>
      <td className="py-3 text-right">
        <ReviewButton request={request} />
      </td>
    </tr>
  );
}

/** One request as a card (below md). */
function RequestCard({ request }: { request: EmployeeCreationRequestResponse }) {
  const { details } = request;

  return (
    <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admin/employee-requests/${request.id}`}
            className="block break-words font-semibold text-on-surface hover:text-primary"
          >
            {details.fullName}
          </Link>
          <p className="mt-0.5 text-[11px] text-outline">
            {[details.position, humanizeEnum(details.employmentType)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 font-body-md text-body-md">
        <div className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-outline">
            Branch
          </dt>
          <dd className="truncate text-on-surface-variant">{request.branchName ?? "—"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-outline">
            Basic salary
          </dt>
          <dd className="truncate tabular-nums text-on-surface-variant">
            {details.basicSalary === null ? "—" : formatMoney(details.basicSalary)}
          </dd>
        </div>
        <div className="col-span-2 min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-outline">
            Requested
          </dt>
          <dd className="text-on-surface-variant">
            {formatDateTime(request.requestedAt)} · by {request.requestedByName ?? "HR"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex">
        <ReviewButton request={request} />
      </div>
    </div>
  );
}