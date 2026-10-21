import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { formatNumber, initials } from "@/lib/format";

/** Every employee in the company, each listed under their own branch. */
export default async function AdminEmployeesPage() {
  await requirePermission("employee:read");

  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    branches = await getBranches();
  } catch (error) {
    return <DataUnavailable title="Employees" subject="The branch list" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const results = await Promise.allSettled(branches.map((branch) => getEmployeesByBranch(branch.id)));
  const groups = branches.map((branch, index) => {
    const result = results[index];
    return {
      branch,
      employees: result?.status === "fulfilled" ? [...result.value].sort((a, b) => a.fullName.localeCompare(b.fullName)) : null,
    };
  });

  const loaded = groups.flatMap((group) => group.employees ?? []);
  const active = loaded.filter((person) => person.employmentStatus === "ACTIVE").length;
  const failed = groups.filter((group) => group.employees === null).length;

  return (
    <>
      <PageHeader
        title="Employees"
        description="Every employee, listed under their branch."
        actions={
          <Link href="/admin/employees/new" className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body-md text-body-md font-bold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant">
            <Icon name="person_add" className="text-[18px]" />
            Add Employee
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Employees" value={formatNumber(loaded.length)} icon="group" tone="primary" />
        <MetricCard label="Active" value={formatNumber(active)} icon="check_circle" tone="primary" />
        <MetricCard label="Branches" value={formatNumber(branches.length)} icon="account_balance" tone="primary" />
      </div>

      {failed > 0 ? <p className="mt-3 text-xs text-error">{failed} branch list(s) could not be loaded, so the totals are incomplete.</p> : null}

      <div className="mt-gutter flex flex-col gap-gutter">
        {groups.length === 0 ? (
          <EmptyState symbol="location_off" title="No branches yet" description="Create a branch first, then add employees to it." />
        ) : (
          groups.map(({ branch, employees }) => (
            <BentoCard key={branch.id} title={branch.name} subtitle={employees ? `${formatNumber(employees.length)} employee${employees.length === 1 ? "" : "s"} · ${branch.code}` : "Could not be loaded"}>
              {!employees ? null : employees.length === 0 ? (
                <p className="py-2 text-sm text-on-surface-variant">No employees in this branch yet.</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="data-table w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                        <th className="pb-3 font-table-header text-table-header uppercase text-outline">Position</th>
                        <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Status</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-md text-body-md text-on-surface">
                      {employees.map((person) => (
                        <tr key={person.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface">
                          <td className="py-3 pl-2">
                            <Link href={`/admin/employees/${person.id}`} className="flex items-center gap-3">
                              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials(person.fullName)}</span>
                              <span>
                                <span className="block font-semibold text-primary">{person.fullName}</span>
                                <span className="block font-mono text-[11px] text-outline">{person.employeeNumber}</span>
                              </span>
                            </Link>
                          </td>
                          <td className="py-3 text-on-surface-variant">{person.position ?? "—"}</td>
                          <td className="py-3 pr-2 text-right"><StatusBadge status={person.employmentStatus} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </BentoCard>
          ))
        )}
      </div>
    </>
  );
}