import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { getBranches } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { formatNumber, humanizeEnum, initials } from "@/lib/format";
import { parseId } from "@/lib/search-params";

/**
 * Employee directory for audit — names, numbers, branch, position and status. Read-only,
 * and deliberately without national IDs, salaries or bank details.
 */
export default async function AuditEmployeesPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  await requirePermission("employee:read");
  const { branch } = await searchParams;
  const branchId = parseId(branch);

  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    branches = await getBranches();
  } catch (error) {
    return <DataUnavailable title="Employees" subject="The branch list" reason={error instanceof Error ? error.message : undefined} />;
  }

  const scope = branchId ? branches.filter((item) => item.id === branchId) : branches;
  const results = await Promise.allSettled(scope.map((item) => getEmployeesByBranch(item.id)));
  const employees = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const failed = results.filter((result) => result.status === "rejected").length;

  const sorted = [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName));
  const active = employees.filter((person) => person.employmentStatus === "ACTIVE").length;

  return (
    <>
      <PageHeader title="Employees" description="The staff register for review. Read-only." />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Employees" value={formatNumber(employees.length)} icon="group" tone="primary" />
        <MetricCard label="Active" value={formatNumber(active)} icon="check_circle" tone="primary" />
        <MetricCard label="Not Active" value={formatNumber(employees.length - active)} icon="person_off" tone="primary" />
      </div>

      <div className="mt-gutter mb-4 flex flex-wrap items-center gap-2">
        <Link href="/audit/employees" className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${!branchId ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
          All branches
        </Link>
        {branches.map((item) => (
          <Link key={item.id} href={`/audit/employees?branch=${item.id}`} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${branchId === item.id ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
            {item.name}
          </Link>
        ))}
      </div>

      {failed > 0 ? <p className="mb-3 text-xs text-error">{failed} branch list(s) could not be loaded, so the totals above are incomplete.</p> : null}

      <BentoCard title="Staff Register" subtitle={`${formatNumber(sorted.length)} shown`}>
        {sorted.length === 0 ? (
          <EmptyState symbol="group_off" title="No employees found" />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Branch</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-outline">Position</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {sorted.map((person) => (
                  <tr key={person.id} className="border-b border-outline-variant/20 last:border-0">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials(person.fullName)}</span>
                        <span>
                          <span className="block font-semibold">{person.fullName}</span>
                          <span className="block font-mono text-[11px] text-outline">{person.employeeNumber}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-on-surface-variant">{person.branchName ?? "—"}</td>
                    <td className="py-3 text-on-surface-variant">{person.position ?? "—"}</td>
                    <td className="py-3 pr-2 text-right text-xs font-medium">{humanizeEnum(person.employmentStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>
    </>
  );
}