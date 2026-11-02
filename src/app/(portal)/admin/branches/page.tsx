import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { deleteBranchAction } from "@/app/actions/branch";
import { BentoCard } from "@/components/shared/bento-card";
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
              <div className="w-full overflow-x-auto">
                <table className="data-table w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Branch</th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">Manager</th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">Contact</th>
                      <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Employees</th>
                      <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Status</th>
                      {canWrite ? <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Actions</th> : null}
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md">
                    {rows.map((branch) => {
                      const count = headcount.get(branch.id);
                      return (
                        <tr key={branch.id} className="group transition-colors">
                          <td className="py-3 pl-2">
                            <Link href={`/admin/branches/${branch.id}`} className="flex items-center gap-2">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary-container/10 text-primary-container">
                                <Icon name="location_city" className="text-sm" />
                              </span>
                              <span className="min-w-0">
                                <span className="block font-medium text-on-surface group-hover:text-primary-container">{branch.name}</span>
                                <span className="block text-[10px] text-outline">{branch.code}</span>
                              </span>
                            </Link>
                          </td>
                          <td className="py-3 text-on-surface-variant">
                            {branch.managerName ?? <span className="text-amber-main">Unassigned</span>}
                          </td>
                          <td className="py-3 text-on-surface-variant">
                            {branch.phone ? <span className="block font-mono text-[11px]">{branch.phone}</span> : null}
                            {branch.email ? <span className="block text-[10px] text-outline">{branch.email}</span> : null}
                            {!branch.phone && !branch.email ? <span className="text-outline">—</span> : null}
                          </td>
                          <td className="py-3 text-right tabular-nums text-on-surface-variant">
                            {count === null || count === undefined ? "—" : formatNumber(count)}
                          </td>
                          <td className="py-3 text-right">
                            <StatusBadge status={branch.status} />
                          </td>
                          {canWrite ? (
                            <td className="py-3 pr-2 text-right">
                              <div className="flex items-start justify-end gap-1">
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
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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