import { differenceInCalendarDays, parseISO } from "date-fns";
import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requireRole } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { MetricCard } from "@/components/shared/metric-card";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getLeaveHistoryForEmployee } from "@/lib/api/leave";
import { formatDate, formatDateRange, formatNumber } from "@/lib/format";
import { buildHref, first, parsePage } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { LeaveRequestResponse } from "@/types";

const BASE_PATH = "/me/leave/history";
const PAGE_SIZE = 10;

type Outcome = "pending" | "approved" | "rejected";

const OUTCOMES: readonly Outcome[] = ["pending", "approved", "rejected"];

/** Both approval stages read as "pending" to the employee; the stage is shown beside it. */
function outcomeOf(request: LeaveRequestResponse): Outcome {
  if (request.status === "APPROVED") return "approved";
  if (request.status === "REJECTED") return "rejected";
  return "pending";
}

function stageText(request: LeaveRequestResponse): string {
  switch (request.status) {
    case "PENDING_MANAGER":
      return "With your branch manager";
    case "PENDING_HR":
      return "With HR for the final decision";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
  }
}

/**
 * Inclusive calendar days, weekends included. The API returns no duration, so it
 * is derived from the two dates; the page says as much under the list.
 */
function daysOf(request: LeaveRequestResponse): number {
  const span = differenceInCalendarDays(
    parseISO(request.endDate),
    parseISO(request.startDate),
  );
  return Number.isNaN(span) ? 0 : span + 1;
}

function datesOf(request: LeaveRequestResponse): string {
  return request.startDate === request.endDate
    ? formatDate(request.startDate)
    : formatDateRange(request.startDate, request.endDate);
}

/** A glyph and tint per kind of leave, matched on the name since the API sends no code. */
function leaveVisual(name: string | null): { icon: string; chip: string } {
  const key = (name ?? "").toLowerCase();

  if (key.includes("sick") || key.includes("medical")) {
    return { icon: "medical_services", chip: "bg-error-container/50 text-error" };
  }
  if (key.includes("compassion") || key.includes("bereave")) {
    return { icon: "favorite", chip: "bg-secondary-container/50 text-secondary" };
  }
  if (key.includes("matern")) {
    return { icon: "pregnant_woman", chip: "bg-primary-fixed/60 text-primary" };
  }
  if (key.includes("patern")) {
    return { icon: "child_care", chip: "bg-primary-fixed/60 text-primary" };
  }
  if (key.includes("study") || key.includes("exam")) {
    return { icon: "school", chip: "bg-primary-fixed/60 text-primary" };
  }
  if (key.includes("annual") || key.includes("vacation")) {
    return { icon: "beach_access", chip: "bg-primary-fixed/60 text-primary" };
  }
  return { icon: "event_note", chip: "bg-primary-fixed/60 text-primary" };
}

/**
 * My leave history — every leave request this employee has made.
 * `GET /leave/employee/{employeeId}` (an employee may read their own), newest
 * first, reached from "View all" on the Request History card of /me/leave.
 *
 * The API returns the whole list, so the tiles, filters and paging are computed
 * here from that one read. Status, year and type live in the URL
 * (`?status=&year=&type=&page=`), so a filtered view is shareable and the back
 * button steps through it.
 *
 * Layout: tiles are 2×2 on phones and four across from `lg`. The table appears
 * from `md`; below it each request is a card, because a seven-column table
 * cannot be read at 360px. Everything a side sheet would have held — the full
 * reason and the decision — is already in the row or card, so there is no
 * overlay to open.
 */
export default async function LeaveHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole(["EMPLOYEE"]);

  const params = await searchParams;
  const statusParam = first(params.status);
  const year = first(params.year) || undefined;
  const type = first(params.type) || undefined;

  if (session.employeeId === null) {
    return (
      <DataUnavailable
        title="Leave history"
        description="All your leave requests and how each one was decided."
        subject="Your leave history"
        reason="Your account is not linked to an employee record yet. Ask HR to finish your onboarding."
      />
    );
  }

  let requests: LeaveRequestResponse[];

  try {
    requests = await getLeaveHistoryForEmployee(session.employeeId);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      throw error;
    }

    return (
      <DataUnavailable
        title="Leave history"
        description="All your leave requests and how each one was decided."
        subject="Your leave history"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const active: Outcome | undefined = (OUTCOMES as readonly string[]).includes(
    statusParam ?? "",
  )
    ? (statusParam as Outcome)
    : undefined;

  // Options come from the data, so the selects never offer a year or a type the
  // employee has no requests in.
  const years = [...new Set(requests.map((r) => r.startDate.slice(0, 4)))].sort(
    (a, b) => b.localeCompare(a),
  );
  const types = [
    ...new Set(
      requests
        .map((r) => r.leaveTypeName)
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  // Year and type narrow the set first; the tiles and tab counts then describe
  // that set, so a tab never promises rows the other filters have removed.
  const scoped = requests.filter(
    (r) =>
      (!year || r.startDate.startsWith(year)) &&
      (!type || r.leaveTypeName === type),
  );

  const inOutcome = (outcome: Outcome) =>
    scoped.filter((r) => outcomeOf(r) === outcome);
  const sumDays = (list: LeaveRequestResponse[]) =>
    list.reduce((total, r) => total + daysOf(r), 0);

  const pending = inOutcome("pending");
  const approved = inOutcome("approved");
  const rejected = inOutcome("rejected");

  const tabs: FilterTab[] = [
    { label: "All", value: undefined, count: scoped.length },
    { label: "Pending", value: "pending", count: pending.length },
    { label: "Approved", value: "approved", count: approved.length },
    { label: "Rejected", value: "rejected", count: rejected.length },
  ];

  const filtered = active ? inOutcome(active) : scoped;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageNumber = Math.min(parsePage(first(params.page)), totalPages - 1);
  const start = pageNumber * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const filtersActive = Boolean(active || year || type);
  const queryParams = { status: active, year, type };

  return (
    <>
      <PageHeader
        title={
          <>
            <Link
              href="/me/leave"
              aria-label="Back to leave overview"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-primary shadow-ambient-1 transition-colors hover:bg-primary hover:text-on-primary"
            >
              <Icon name="arrow_back" className="text-[20px]" />
            </Link>
            Leave history
          </>
        }
        description="All your leave requests and how each one was decided."
        pill={
          <CountPill
            label={`${formatNumber(requests.length)} ${
              requests.length === 1 ? "request" : "requests"
            }`}
            tone="neutral"
          />
        }
      />

      <div className="flex flex-col gap-gutter">
        {/* ─────────────────────────────── metric tiles ────────────────── */}
        <div className="grid grid-cols-2 gap-gutter lg:grid-cols-4">
          <MetricCard
            label="Total requests"
            value={formatNumber(scoped.length)}
            icon="event_note"
            tone="primary"
            hint={`${formatNumber(sumDays(scoped))} days requested`}
          />
          <MetricCard
            label="Approved"
            value={formatNumber(approved.length)}
            icon="check_circle"
            tone="tertiary"
            hint={`${formatNumber(sumDays(approved))} days granted`}
          />
          <MetricCard
            label="Pending"
            value={formatNumber(pending.length)}
            icon="hourglass_top"
            tone="amber"
            accent={pending.length > 0}
            hint={
              pending.length > 0
                ? `${formatNumber(sumDays(pending))} days awaiting a decision`
                : "Nothing waiting"
            }
          />
          <MetricCard
            label="Rejected"
            value={formatNumber(rejected.length)}
            icon="cancel"
            tone="error"
            hint={
              rejected.length > 0
                ? `${formatNumber(sumDays(rejected))} days declined`
                : "None declined"
            }
          />
        </div>

        <BentoCard
          title={
            <span className="flex items-center gap-2">
              <Icon
                name="history"
                className="text-[18px] text-on-surface-variant"
              />
              Requests
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
                preserve={{ year, type }}
                className="flex-nowrap lg:flex-wrap [&>a]:whitespace-nowrap"
              />
            </div>

            <form
              method="get"
              action={BASE_PATH}
              className="grid grid-cols-2 gap-2 sm:flex sm:items-center"
            >
              {active ? <input type="hidden" name="status" value={active} /> : null}

              <FilterSelect
                name="year"
                label="Year"
                defaultValue={year}
                className="sm:w-36"
                options={[
                  { value: "", label: "All years" },
                  ...years.map((value) => ({ value, label: `Year: ${value}` })),
                ]}
              />
              <FilterSelect
                name="type"
                label="Leave type"
                defaultValue={type}
                className="sm:w-48"
                options={[
                  { value: "", label: "All types" },
                  ...types.map((value) => ({ value, label: value })),
                ]}
              />
              <Button
                type="submit"
                variant="outline"
                size="md"
                icon="filter_list"
                className="col-span-2 sm:col-span-1"
              >
                Apply
              </Button>
            </form>
          </div>

          {/* ───────────────────────────── results ───────────────────── */}
          {requests.length === 0 ? (
            <EmptyState
              symbol="event_busy"
              title="No leave requests yet"
              description="Requests you make will be listed here, with the decision on each."
              action={
                <Link
                  href="/me/leave"
                  className={buttonVariants({ className: "w-fit" })}
                >
                  Go to leave
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              symbol="event_busy"
              title="No leave requests match these filters"
              description="There are no requests for the selected status, year or leave type."
              action={
                <Link
                  href={BASE_PATH}
                  className={buttonVariants({
                    variant: "outline",
                    className: "w-fit",
                  })}
                >
                  <Icon name="filter_alt_off" className="text-[18px]" />
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
                    <LeaveCard request={request} />
                  </li>
                ))}
              </ul>

              {/* md and up: the table. */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left font-body-md text-body-md">
                  <thead>
                    <tr className="border-b border-outline-variant/50 font-table-header text-table-header uppercase text-outline">
                      <th className="pb-3 pr-4">Leave type</th>
                      <th className="pb-3 pr-4">Dates</th>
                      <th className="pb-3 pr-4">Days</th>
                      <th className="pb-3 pr-4">Reason</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((request) => (
                      <LeaveRow key={request.id} request={request} />
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
                {formatNumber(filtered.length)}. Days are calendar days,
                weekends included.
              </p>
            </>
          )}
        </BentoCard>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ parts -- */

function TypeChip({ request }: { request: LeaveRequestResponse }) {
  const visual = leaveVisual(request.leaveTypeName);

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        visual.chip,
      )}
    >
      <Icon name={visual.icon} className="text-[18px]" />
    </span>
  );
}

function DaysPill({ request }: { request: LeaveRequestResponse }) {
  const days = daysOf(request);

  return (
    <span className="inline-flex items-center rounded-full bg-secondary-fixed px-2 py-0.5 text-[11px] font-semibold text-on-secondary-fixed">
      {formatNumber(days)} {days === 1 ? "day" : "days"}
    </span>
  );
}

/** The badge shows the outcome; both pending stages read as "Pending". */
function LeaveBadge({ request }: { request: LeaveRequestResponse }) {
  const outcome = outcomeOf(request);

  return (
    <StatusBadge
      status={outcome === "pending" ? "PENDING" : outcome.toUpperCase()}
    />
  );
}

/** Who has it, or — for a rejection — why. Never invented: it is what the API sent. */
function Decision({
  request,
  block = false,
}: {
  request: LeaveRequestResponse;
  block?: boolean;
}) {
  if (request.status === "REJECTED") {
    return (
      <div
        className={cn(
          "border-l-2 border-error bg-error-container/30 p-2.5",
          block ? "rounded-r-lg" : "max-w-xs rounded-r-lg",
        )}
      >
        <p className="font-table-header text-table-header uppercase text-error">
          Reason given
        </p>
        <p className="mt-1 break-words italic text-error">
          {request.rejectionReason
            ? `“${request.rejectionReason}”`
            : "No reason was given."}
        </p>
      </div>
    );
  }

  return (
    <span
      className={cn(
        request.status === "APPROVED"
          ? "font-medium text-tertiary"
          : "italic text-on-surface-variant",
      )}
    >
      {stageText(request)}
    </span>
  );
}

/** One request as a table row (md and up). */
function LeaveRow({ request }: { request: LeaveRequestResponse }) {
  return (
    <tr className="border-b border-outline-variant/25 align-top last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <TypeChip request={request} />
          <div className="min-w-0">
            <p className="font-semibold text-on-surface">
              {request.leaveTypeName ?? "Leave"}
            </p>
            <p className="text-[11px] text-outline">Request #{request.id}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap py-3 pr-4 font-medium text-on-surface">
        {datesOf(request)}
      </td>
      <td className="py-3 pr-4">
        <DaysPill request={request} />
      </td>
      <td className="max-w-[14rem] py-3 pr-4 text-on-surface-variant">
        <span className="line-clamp-2 break-words" title={request.reason ?? undefined}>
          {request.reason || "—"}
        </span>
      </td>
      <td className="py-3 pr-4">
        <LeaveBadge request={request} />
      </td>
      <td className="py-3 text-on-surface-variant">
        <Decision request={request} />
      </td>
    </tr>
  );
}

/** One request as a card (below md). */
function LeaveCard({ request }: { request: LeaveRequestResponse }) {
  const rejected = request.status === "REJECTED";

  return (
    <div
      className={cn(
        "rounded-lg border bg-surface-container-lowest p-4",
        rejected ? "border-error/30" : "border-outline-variant/40",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant/25 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <TypeChip request={request} />
          <div className="min-w-0">
            <p className="break-words font-semibold text-on-surface">
              {request.leaveTypeName ?? "Leave"}
            </p>
            <p className="text-[11px] text-outline">Request #{request.id}</p>
          </div>
        </div>
        <LeaveBadge request={request} />
      </div>

      <dl className="mt-3 flex flex-col gap-2 font-body-md text-body-md">
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-on-surface-variant">Dates</dt>
          <dd className="text-right font-semibold text-on-surface">
            {datesOf(request)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="shrink-0 text-on-surface-variant">Duration</dt>
          <dd>
            <DaysPill request={request} />
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-on-surface-variant">Reason</dt>
          <dd className="min-w-0 break-words text-right text-on-surface">
            {request.reason || "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-3 border-t border-outline-variant/25 pt-3 font-body-md text-body-md">
        <Decision request={request} block />
      </div>
    </div>
  );
}