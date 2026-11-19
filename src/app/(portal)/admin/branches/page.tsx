import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { deleteBranchAction, deleteBranchesAction } from "@/app/actions/branch";
import { BentoCard } from "@/components/shared/bento-card";
import { BulkDeleteBar, RowCheckbox, SelectAllCheckbox } from "@/components/shared/bulk-delete";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { DonutChart } from "@/components/shared/charts";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { hasPermission } from "@/config/roles";
import { getBranches } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { formatNumber } from "@/lib/format";
import type { BranchResponse } from "@/types";

/**
 * Branch directory.
 *
 * `GET /branches` returns `List<BranchResponse>` — the bare entity, with no
 * aggregates. Headcount is real: it is counted from `GET /employees/by-branch/{id}`,
 * one call per branch (acceptable at a handful of branches). Adding and editing
 * branches is SUPER_ADMIN / ADMIN; deactivating is SUPER_ADMIN only (on the edit page).
 */
const STATUS_TABS: readonly FilterTab[] = [
  { label: "All Branches" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

/** Ties the row tick boxes to the bulk-delete form above the table. */
const BULK_FORM = "bulk-delete-branches";

/** Shared palette for the headcount donut; cycles if there are more branches. */
const DONUT_COLORS = [
  "var(--color-blue)",
  "var(--color-green-main)",
  "var(--color-amber-main)",
  "var(--color-chart-track)",
];

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requirePermission("branch:read");
  const canWrite = hasPermission(session.role, "branch:write");

  // searchParams is a Promise in Next.js 16 — it must be awaited.
  const { status } = await searchParams;

  let branches: BranchResponse[];
  try {
    branches = await getBranches();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");
    return (
      <DataUnavailable
        title="Branches"
        description="Manage organization locations and regional performance."
        subject="The branch directory"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  // Headcounts are a second, independent read. `allSettled` so one failing
  // branch does not blank a page whose primary data loaded fine.
  const counts = await Promise.allSettled(branches.map((branch) => getEmployeesByBranch(branch.id)));
  const headcount = new Map<number, number | null>(
    branches.map((branch, index) => {
      const result = counts[index];
      return [branch.id, result && result.status === "fulfilled" ? result.value.length : null];
    }),
  );

  const rows = status ? branches.filter((branch) => branch.status === status) : branches;
  const active = branches.filter((branch) => branch.status === "ACTIVE").length;
  const unmanaged = branches.filter((branch) => branch.managerName === null);
  const counted = [...headcount.values()].filter((value): value is number => value !== null);
  const totalEmployees = counted.reduce((sum, value) => sum + value, 0);

  return (
    <>
      <PageHeader
        title="Branches"
        description="Manage organization locations and regional performance."
        pill={<CountPill label={`${active} Active`} />}
        actions={
          canWrite ? (
            <Link
              href="/admin/branches/new"
              className="bento-shadow flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body-md text-body-md font-bold text-on-primary transition-colors hover:bg-on-primary-fixed-variant"
            >
              <Icon name="add" className="text-[18px]" />
              Add Branch
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* main column */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <div className="bento-shadow flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface-container-lowest p-3">
            <FilterTabs tabs={STATUS_TABS} active={status} param="status" basePath="/admin/branches" />
          </div>

          <BentoCard
            title={status ? `${status === "ACTIVE" ? "Active" : "Inactive"} branches` : "All branches"}
            subtitle={`${formatNumber(rows.length)} shown · ${formatNumber(totalEmployees)} employees`}
          >
            {rows.length === 0 ? (
              <EmptyState
                symbol="location_off"
                title="No branches to show"
                description={
                  status
                    ? "No branch currently holds this status."
                    : "Branches appear here once they have been created."
                }
              />
            ) : (
              <>
              {canWrite ? (
                <BulkDeleteBar
                  formId={BULK_FORM}
                  action={deleteBranchesAction}
                  noun="branch"
                  plural="branches"
                  warning="Each ticked branch is deleted and the other branch codes close up. A branch that still has employees or an active terminal is refused and kept."
                />
              ) : null}
              {canWrite ? (
                <label className="mb-3 flex w-fit items-center gap-2 text-xs font-semibold text-on-surface-variant print:hidden">
                  <SelectAllCheckbox formId={BULK_FORM} label="Select all branches" />
                  Select all
                </label>
              ) : null}
              {/* A card per branch, as on the Employees page. */}
              <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                {rows.map((branch) => {
                  const count = headcount.get(branch.id);
                  return (
                    <li
                      key={branch.id}
                      className="group flex min-w-0 flex-col gap-4 rounded-card border border-outline-variant/40 bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-low sm:p-card-padding"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex items-center gap-3">
                          {canWrite ? (
                            <span className="print:hidden">
                              <RowCheckbox formId={BULK_FORM} id={branch.id} label={branch.name} />
                            </span>
                          ) : null}
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                            <Icon name="location_city" />
                          </span>
                        </span>
                        <StatusBadge status={branch.status} />
                      </div>

                      <Link href={`/admin/branches/${branch.id}`} className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-on-surface group-hover:text-primary-container">{branch.name}</h3>
                        <p className="font-mono text-xs text-outline">{branch.code}</p>
                      </Link>

                      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-surface-container-low p-3 text-xs">
                        <div className="min-w-0">
                          <dt className="text-on-surface-variant">Manager</dt>
                          <dd className="break-words font-semibold text-on-surface">
                            {branch.managerName ?? <span className="text-amber-main">Unassigned</span>}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-on-surface-variant">Employees</dt>
                          <dd className="font-semibold tabular-nums text-on-surface">
                            {count === null || count === undefined ? "—" : formatNumber(count)}
                          </dd>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <dt className="text-on-surface-variant">Contact</dt>
                          <dd className="break-words text-on-surface">
                            {[branch.phone, branch.email].filter(Boolean).join(" · ") || "—"}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant/40 pt-3">
                        <Link
                          href={`/admin/branches/${branch.id}`}
                          className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                        >
                          Open
                          <Icon name="arrow_forward" className="text-[18px]" />
                        </Link>
                        {canWrite ? (
                          <div className="flex items-start gap-1">
                            <Link
                              href={`/admin/branches/${branch.id}/edit`}
                              aria-label={`Edit ${branch.name}`}
                              className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant hover:text-primary"
                            >
                              <Icon name="edit" className="text-[18px]" />
                            </Link>
                            <ConfirmDeleteButton
                              compact
                              action={deleteBranchAction}
                              id={branch.id}
                              name={branch.name}
                              title="Delete this branch?"
                              confirmText="The other branch codes will close up to stay in order."
                            />
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              </>
            )}
          </BentoCard>
        </div>

        {/* side column */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <SegmentStrip
            segments={[
              { label: "Branches", value: formatNumber(branches.length) },
              { label: "Employees", value: formatNumber(totalEmployees) },
              {
                label: "Unassigned",
                value: formatNumber(unmanaged.length),
                tone: unmanaged.length > 0 ? "warning" : "default",
              },
            ]}
          />

          {counted.length > 0 ? (
            <BentoCard title="Headcount by branch">
              <DonutChart
                segments={branches
                  .filter((branch) => (headcount.get(branch.id) ?? 0) > 0)
                  .map((branch, index) => ({
                    label: branch.name,
                    value: headcount.get(branch.id) ?? 0,
                    color: DONUT_COLORS[index % DONUT_COLORS.length],
                  }))}
              />
            </BentoCard>
          ) : null}

          <BentoCard title="Needs attention" subtitle="Branches with no manager assigned">
            {unmanaged.length === 0 ? (
              <p className="py-4 text-center font-body-md text-body-md text-outline">Every branch has a manager.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {unmanaged.map((branch) => (
                  <li key={branch.id}>
                    <Link
                      href={canWrite ? `/admin/branches/${branch.id}/edit` : `/admin/branches/${branch.id}`}
                      className="group -mx-2 flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-surface-container"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[11px] font-semibold text-on-surface group-hover:text-primary-container">{branch.name}</span>
                        <span className="block text-[10px] text-on-surface-variant">{branch.code}</span>
                      </span>
                      <span className="shrink-0 rounded bg-amber-main/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-main">No manager</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </BentoCard>
        </div>
      </div>
    </>
  );
}