import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requireRole } from "@/app/lib/dal";
import { RequestStatusPill } from "@/components/features/employee/request-status-pill";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { MetricCard } from "@/components/shared/metric-card";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getMyEmployeeRequests } from "@/lib/api/employee-request";
import { formatDate, formatNumber, humanizeEnum, initials } from "@/lib/format";
import { buildHref, first, parsePage } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import {
  EMPLOYEE_REQUEST_STATUSES,
  type EmployeeCreationRequestResponse,
  type EmployeeRequestStatus,
} from "@/types/employee-request";

const BASE_PATH = "/hr/employees/requests";
const PAGE_SIZE = 10;

/**
 * My requests — what this HR manager has submitted and what became of it.
 * `GET /employee-requests/mine`, newest first.
 *
 * The API returns the whole list, so the tile counts, the filters and the paging
 * are all computed here from that one read. Every filter lives in the URL
 * (`?status=&q=&branch=&page=`), which keeps a filtered view shareable and lets
 * the back button step through it.
 *
 * A rejected request shows the admin's reason in full, in place: that text is the
 * only thing telling HR what to fix before submitting again.
 *
 * Layout: tiles and filters stack on phones; the table appears from `md`, and
 * below it each request is a card, because a six-column table cannot be read at
 * 360px.
 */
export default async function MyEmployeeRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["HR_MANAGER"]);

  const params = await searchParams;
  const statusParam = first(params.status);
  const q = first(params.q)?.trim() || undefined;
  const branch = first(params.branch) || undefined;

  let requests: EmployeeCreationRequestResponse[];

  try {
    requests = await getMyEmployeeRequests();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="My requests"
        description="New employees you have sent for admin approval."
        subject="Your requests"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const active: EmployeeRequestStatus | undefined = (
    EMPLOYEE_REQUEST_STATUSES as readonly string[]
  ).includes(statusParam ?? "")
    ? (statusParam as EmployeeRequestStatus)
    : undefined;

  const count = (status: EmployeeRequestStatus) =>
    requests.filter((r) => r.status === status).length;

  const pending = count("PENDING");
  const approved = count("APPROVED");
  const rejected = count("REJECTED");

  // Tab counts describe the whole list, not the search, so a tab never reads
  // "Rejected 0" while a search happens to hide the rejected ones.
  const tabs: FilterTab[] = [
    { label: "All", value: undefined, count: requests.length },
    { label: "Pending", value: "PENDING", count: pending },
    { label: "Approved", value: "APPROVED", count: approved },
    { label: "Rejected", value: "REJECTED", count: rejected },
  ];

  const branches = [
    ...new Set(
      requests
        .map((r) => r.branchName)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const needle = q?.toLowerCase();

  const filtered = requests.filter((r) => {
    if (active && r.status !== active) return false;
    if (branch && r.branchName !== branch) return false;
    if (!needle) return true;

    const d = r.details;
    return [d.fullName, d.nationalId, d.kraPin, d.position].some((value) =>
      value?.toLowerCase().includes(needle),
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageNumber = Math.min(parsePage(first(params.page)), totalPages - 1);
  const start = pageNumber * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const filtersActive = Boolean(active || q || branch);
  const queryParams = { status: active, q, branch };

  return (
    <>
      <PageHeader
        title="My requests"
        description="Track the employees you've submitted for approval."
        pill={
          <CountPill
            label={`${formatNumber(requests.length)} total`}
            tone="neutral"
          />
        }
        actions={
          <Link
            href="/hr/employees/new"
            className={buttonVariants({ className: "w-fit" })}
          >
            <Icon name="person_add" className="text-[18px]" />
            New employee request
          </Link>
        }
      />

      <div className="flex flex-col gap-gutter">
        {/* ─────────────────────────────── metric tiles ────────────────── */}
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-3">
          <MetricCard
            label="Pending"
            value={formatNumber(pending)}
            icon="pending"
            tone="amber"
            accent={pending > 0}
            hint={pending > 0 ? "Waiting for an admin" : "Nothing waiting"}
          />
          <MetricCard
            label="Approved"
            value={formatNumber(approved)}
            icon="check_circle"
            tone="tertiary"
            hint="Added to the employee directory"
          />
          <MetricCard
            label="Rejected"
            value={formatNumber(rejected)}
            icon="cancel"
            tone="error"
            accent={rejected > 0}
            hint={
              rejected > 0
                ? "Read the reason, then submit again"
                : "None sent back"
            }
          />
        </div>

        <BentoCard
          title={
            <span className="flex items-center gap-2">
              <Icon
                name="pending_actions"
                className="text-[18px] text-on-surface-variant"
              />
              Submitted requests
            </span>
          }
          subtitle={`${formatNumber(filtered.length)} ${
            filtered.length === 1 ? "request" : "requests"
          }${filtersActive ? " match your filters" : ""}`}
        >
          {/* ───────────────────────────── filters ───────────────────── */}
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
              <FilterTabs
                tabs={tabs}
                active={active}
                param="status"
                basePath={BASE_PATH}
                preserve={{ q, branch }}
                className="flex-nowrap lg:flex-wrap [&>a]:whitespace-nowrap"
              />
            </div>

            <form
              method="get"
              action={BASE_PATH}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              {active ? <input type="hidden" name="status" value={active} /> : null}

              <div className="relative sm:w-56">
                <label htmlFor="filter-q" className="sr-only">
                  Search by name, ID number or KRA PIN
                </label>
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline"
                />
                <input
                  id="filter-q"
                  name="q"
                  type="search"
                  defaultValue={q ?? ""}
                  placeholder="Name, ID or KRA PIN"
                  className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-3 font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <FilterSelect
                name="branch"
                label="Branch"
                defaultValue={branch}
                className="sm:w-44"
                options={[
                  { value: "", label: "All branches" },
                  ...branches.map((name) => ({ value: name, label: name })),
                ]}
              />

              <Button type="submit" variant="outline" size="md" icon="filter_list">
                Apply
              </Button>
            </form>
          </div>

          {/* ───────────────────────────── results ───────────────────── */}
          {requests.length === 0 ? (
            <EmptyState
              symbol="pending_actions"
              title="You haven't submitted any requests yet"
              description="Add an employee and it will appear here while it waits for an admin."
              action={
                <Link
                  href="/hr/employees/new"
                  className={buttonVariants({ className: "w-fit" })}
                >
                  <Icon name="person_add" className="text-[18px]" />
                  New employee request
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              symbol="filter_alt_off"
              title="No requests match these filters"
              description="Try a different status, branch or search."
              action={
                <Link
                  href={BASE_PATH}
                  className={buttonVariants({ variant: "outline", className: "w-fit" })}
                >
                  Clear filters
                </Link>
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
                      <th className="pb-3 pr-4">Submitted</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((request) => (
                      <RequestRow key={request.id} request={request} />
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                data={{
                  pageNumber,
                  totalPages,
                  last: pageNumber >= totalPages - 1,
                }}
                hrefFor={(page) => buildHref(BASE_PATH, queryParams, page)}
              />
              <p className="mt-3 text-[11px] text-outline">
                Showing {formatNumber(start + 1)}–
                {formatNumber(start + visible.length)} of{" "}
                {formatNumber(filtered.length)}
              </p>
            </>
          )}
        </BentoCard>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ parts -- */

const AVATAR_TONE: Record<EmployeeRequestStatus, string> = {
  PENDING: "bg-amber-main/15 text-amber-main",
  APPROVED: "bg-tertiary-container/15 text-tertiary",
  REJECTED: "bg-error-container text-error",
};

function Avatar({ request }: { request: EmployeeCreationRequestResponse }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        AVATAR_TONE[request.status],
      )}
    >
      {initials(request.details.fullName)}
    </span>
  );
}

function subtitle(request: EmployeeCreationRequestResponse): string {
  return [request.details.position, humanizeEnum(request.details.employmentType)]
    .filter((part) => part && part !== "—")
    .join(" · ");
}

/** One request as a table row (md and up). */
function RequestRow({ request }: { request: EmployeeCreationRequestResponse }) {
  return (
    <tr className="border-b border-outline-variant/25 align-top last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <Avatar request={request} />
          <div className="min-w-0">
            <p className="font-semibold text-on-surface">
              {request.details.fullName}
            </p>
            <p className="text-[11px] text-outline">
              Request #{request.id}
              {subtitle(request) ? ` · ${subtitle(request)}` : ""}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 text-on-surface-variant">
        {request.branchName ?? "—"}
        {request.departmentName ? (
          <span className="block text-[11px] text-outline">
            {request.departmentName}
          </span>
        ) : null}
      </td>
      <td className="whitespace-nowrap py-3 pr-4 text-on-surface-variant">
        {formatDate(request.requestedAt)}
      </td>
      <td className="py-3 pr-4">
        <RequestStatusPill status={request.status} short />
      </td>
      <td className="max-w-xs py-3 text-on-surface-variant">
        <Outcome request={request} />
      </td>
    </tr>
  );
}

/** One request as a card (below md). */
function RequestCard({ request }: { request: EmployeeCreationRequestResponse }) {
  const rejected = request.status === "REJECTED";

  return (
    <div
      className={cn(
        "rounded-lg border bg-surface-container-lowest p-4",
        rejected ? "border-error/30" : "border-outline-variant/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar request={request} />
          <div className="min-w-0">
            <p className="break-words font-semibold text-on-surface">
              {request.details.fullName}
            </p>
            {subtitle(request) ? (
              <p className="text-[11px] text-outline">{subtitle(request)}</p>
            ) : null}
          </div>
        </div>
        <RequestStatusPill status={request.status} short />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-outline-variant/25 pt-3 font-body-md text-body-md">
        <div className="min-w-0">
          <dt className="font-table-header text-table-header uppercase text-outline">
            Branch
          </dt>
          <dd className="truncate text-on-surface-variant">
            {request.branchName ?? "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="font-table-header text-table-header uppercase text-outline">
            Submitted
          </dt>
          <dd className="text-on-surface-variant">
            {formatDate(request.requestedAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        <Outcome request={request} card />
      </div>

      {rejected ? (
        <Link
          href="/hr/employees/new"
          className={buttonVariants({
            variant: "outline",
            size: "md",
            block: true,
            className: "mt-3",
          })}
        >
          <Icon name="person_add" className="text-[18px]" />
          Submit again
        </Link>
      ) : null}
    </div>
  );
}

/**
 * What became of the request. `card` swaps the table's plain text for the tinted
 * blocks the stacked layout uses.
 */
function Outcome({
  request,
  card = false,
}: {
  request: EmployeeCreationRequestResponse;
  card?: boolean;
}) {
  if (request.status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-dashed border-outline-variant px-2 py-0.5 text-[11px] text-on-surface-variant">
        <Icon name="schedule" className="text-[14px]" />
        Awaiting review
      </span>
    );
  }

  if (request.status === "APPROVED") {
    const text = (
      <>
        <span className="font-medium text-on-surface">
          Approved{request.reviewedByName ? ` by ${request.reviewedByName}` : ""}
        </span>
        <span className="text-outline"> · </span>
        {formatDate(request.reviewedAt)}
        <span className="block text-[11px] text-outline">
          Added to the employee directory
        </span>
      </>
    );

    return card ? (
      <div className="rounded-lg bg-tertiary-container/10 p-2.5 font-body-md text-body-md text-tertiary">
        {text}
      </div>
    ) : (
      <span>{text}</span>
    );
  }

  const reason = (
    <>
      <span className="block font-table-header text-table-header uppercase text-error">
        Rejected{request.reviewedByName ? ` by ${request.reviewedByName}` : ""}
        {request.reviewedAt ? ` · ${formatDate(request.reviewedAt)}` : ""}
      </span>
      <span className="mt-1 block break-words italic text-error">
        {request.rejectionReason
          ? `“${request.rejectionReason}”`
          : "No reason was given."}
      </span>
    </>
  );

  return (
    <div className="rounded-r-lg border-l-2 border-error bg-error-container/30 p-2.5 font-body-md text-body-md">
      {reason}
    </div>
  );
}