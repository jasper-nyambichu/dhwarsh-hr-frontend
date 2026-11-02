import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { AuditLogTable } from "@/components/features/audit/audit-log-table";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Icon } from "@/components/ui/icon";
import { getAuditFilterOptions, getAuditLogs, getAuditSummary, type AuditCategory } from "@/lib/api/audit";
import { actionLabel } from "@/lib/audit-format";
import { formatNumber } from "@/lib/format";
import { buildHref, first, parseDate, parseId, parsePage } from "@/lib/search-params";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

/** The cards at the top: what an auditor tracks most. Opening one filters the events to it. */
const CATEGORIES: readonly { key: AuditCategory; label: string; icon: string }[] = [
  { key: "DAMAGES", label: "Damages", icon: "report" },
  { key: "LOGINS", label: "Logins", icon: "login" },
  { key: "APPROVALS", label: "Approvals", icon: "fact_check" },
];

function parseCategory(value: string | undefined): AuditCategory | undefined {
  return CATEGORIES.find((category) => category.key === value)?.key;
}

/**
 * The full history log — newest first, filterable by action, record type, user and date,
 * paginated, and exportable as CSV. Read-only: nothing here can change an entry.
 */
export async function AuditLogView({
  searchParams,
  basePath,
  detailBasePath,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  basePath: string;
  detailBasePath: string;
}) {
  const params = await searchParams;
  const category = parseCategory(first(params.category));
  const action = first(params.action) || undefined;
  const entityType = first(params.entityType) || undefined;
  const userId = parseId(first(params.user));
  const from = parseDate(first(params.from));
  const to = parseDate(first(params.to));
  const page = parsePage(first(params.page));

  let logs: Awaited<ReturnType<typeof getAuditLogs>>;
  let options: Awaited<ReturnType<typeof getAuditFilterOptions>>;
  try {
    [logs, options] = await Promise.all([
      getAuditLogs({ category, action, entityType, userId, from, to, page, size: PAGE_SIZE }),
      getAuditFilterOptions(),
    ]);
  } catch (error) {
    return (
      <DataUnavailable
        title="Audit Logs"
        description="The full history of actions in the system."
        subject="The audit log"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  // The card figures are extras: one that cannot be read must not blank the log.
  const [totalResults, summaryResult] = await Promise.all([
    Promise.allSettled(CATEGORIES.map((item) => getAuditLogs({ category: item.key, size: 1 }))),
    getAuditSummary().then(
      (summary) => summary,
      () => null,
    ),
  ]);

  const hints: Record<AuditCategory, string> = {
    DAMAGES: "Recorded, consented to, overridden or cancelled",
    LOGINS: summaryResult ? `${formatNumber(summaryResult.loginFailed)} failed in the last 7 days` : "Successful, failed and blocked",
    APPROVALS: "Everything approved or rejected",
  };

  const filters = { category, action, entityType, user: userId, from, to };
  const exportHref = buildHref("/api/audit/export", filters);
  const hasFilters = Object.values(filters).some((value) => value !== undefined);
  const selected = CATEGORIES.find((item) => item.key === category);

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Every login, change and agent payment — a history nobody can edit."
        actions={
          <a
            href={exportHref}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-primary px-4 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed"
          >
            <Icon name="download" className="text-[18px]" />
            Export CSV
          </a>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((item, index) => {
          const active = item.key === category;
          const total = totalResults[index];

          return (
            <Link
              key={item.key}
              href={active ? basePath : buildHref(basePath, { category: item.key })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "bento-card flex min-w-0 items-center gap-3 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active ? "ring-2 ring-primary" : "hover:bg-surface-container-low",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                <Icon name={item.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-on-surface">{item.label}</span>
                <span className="block break-words text-xs text-on-surface-variant">{hints[item.key]}</span>
              </span>
              <span className="shrink-0 font-card-stat text-xl font-bold tabular-nums text-on-surface">
                {total?.status === "fulfilled" ? formatNumber(total.value.totalElements) : "—"}
              </span>
            </Link>
          );
        })}
      </div>

      <form method="get" action={basePath} className="mb-4 grid grid-cols-1 gap-3 rounded-card bg-surface-container-lowest p-3 shadow-ambient-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {category ? <input type="hidden" name="category" value={category} /> : null}
        <FilterSelect
          name="action"
          label="Action"
          defaultValue={action}
          options={[{ value: "", label: "All actions" }, ...options.actions.map((value) => ({ value, label: actionLabel(value) }))]}
        />
        <FilterSelect
          name="entityType"
          label="Record type"
          defaultValue={entityType}
          options={[{ value: "", label: "All records" }, ...options.entityTypes.map((value) => ({ value, label: value }))]}
        />
        <FilterSelect
          name="user"
          label="User"
          defaultValue={userId ? String(userId) : ""}
          options={[{ value: "", label: "All users" }, ...options.users.map((user) => ({ value: String(user.id), label: user.username }))]}
        />
        <input type="date" name="from" defaultValue={from} aria-label="From date" className="h-10 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface" />
        <input type="date" name="to" defaultValue={to} aria-label="To date" className="h-10 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface" />
        <div className="flex gap-2">
          <button type="submit" className="h-10 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-container">
            Apply
          </button>
          {hasFilters ? (
            <Link href={basePath} className="flex h-10 items-center rounded-lg border border-outline-variant px-3 text-sm text-on-surface-variant hover:bg-surface-container-low">
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      <BentoCard title={selected ? `${selected.label} events` : "Events"} subtitle={`${formatNumber(logs.totalElements)} found · newest first`}>
        {logs.content.length === 0 ? (
          <EmptyState symbol="policy" title="No events match" description="Try widening the dates or clearing a filter." />
        ) : (
          <>
            <AuditLogTable logs={logs.content} detailBasePath={detailBasePath} />
            <Pagination data={logs} hrefFor={(target) => buildHref(basePath, filters, target)} />
          </>
        )}
      </BentoCard>
    </>
  );
}
