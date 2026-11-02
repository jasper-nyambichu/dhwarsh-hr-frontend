import Link from "next/link";

import { BentoCard } from "@/components/shared/bento-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { formatMoney, formatNumber } from "@/lib/format";
import type { BranchResponse, EmployeeDirectoryResponse } from "@/types";

/**
 * The dashboards' way into a branch: a card per branch, then that branch's employees.
 * Shared by the Admin and Agent dashboards so both show the same thing. Terminated staff are no
 * longer existing employees, so they are left out here.
 */

export function existingEmployees(employees: EmployeeDirectoryResponse[]): EmployeeDirectoryResponse[] {
  return employees.filter((person) => person.employmentStatus !== "TERMINATED");
}

export type BranchCardItem = {
  branch: BranchResponse;
  /** Null when this branch's list could not be read. */
  employeeCount: number | null;
};

export function BranchCards({ items, basePath }: { items: BranchCardItem[]; basePath: string }) {
  if (items.length === 0) {
    return <EmptyState symbol="location_off" title="No branches yet" description="Branches appear here once they have been created." />;
  }

  return (
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
      {items.map(({ branch, employeeCount }) => (
        <Link
          key={branch.id}
          href={`${basePath}/${branch.id}`}
          className="bento-card group flex min-w-0 flex-col gap-4 p-4 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-card-padding"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
              <Icon name="location_city" />
            </span>
            <StatusBadge status={branch.status} />
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-on-surface group-hover:text-primary-container">{branch.name}</h2>
            <p className="font-mono text-xs text-outline">{branch.code}</p>
          </div>
          <p className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant/40 pt-3 text-sm text-on-surface-variant">
            <span>
              {employeeCount === null ? "Employees could not be read" : `${formatNumber(employeeCount)} employee${employeeCount === 1 ? "" : "s"}`}
            </span>
            <Icon name="arrow_forward" className="text-[18px]" />
          </p>
        </Link>
      ))}
    </div>
  );
}

export function BranchEmployeesTable({
  employees,
  employeeHref,
  emptyDescription,
}: {
  employees: EmployeeDirectoryResponse[];
  /** Links each name to the employee's record. Leave out when the viewer has no such page. */
  employeeHref?: (id: number) => string;
  emptyDescription: string;
}) {
  const existing = existingEmployees(employees);

  if (existing.length === 0) {
    return <EmptyState symbol="group" title="No employees" description={emptyDescription} />;
  }

  const sorted = [...existing].sort((a, b) => a.fullName.localeCompare(b.fullName));
  const header = "pb-3 font-table-header text-table-header uppercase text-outline";

  return (
    <BentoCard title="Employees" subtitle={`${formatNumber(existing.length)} in this branch`}>
      <ul className="flex flex-col gap-3 md:hidden">
        {sorted.map((person) => (
          <li key={person.id} className="min-w-0 rounded-lg border border-outline-variant/40 p-3">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="min-w-0 break-words font-semibold text-on-surface">
                {employeeHref ? (
                  <Link href={employeeHref(person.id)} className="text-primary hover:underline">
                    {person.fullName}
                  </Link>
                ) : (
                  person.fullName
                )}
              </p>
              <span className="shrink-0 font-mono text-xs text-on-surface-variant">{person.employeeNumber}</span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div className="min-w-0">
                <dt className="text-outline">Phone No.</dt>
                <dd className="break-words tabular-nums text-on-surface">{person.phone ?? "—"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-outline">Department</dt>
                <dd className="break-words text-on-surface">{person.departmentName ?? "—"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-outline">Agent Name</dt>
                <dd className="break-words text-on-surface">{person.agentName ?? "—"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-outline">Basic Salary</dt>
                <dd className="break-words tabular-nums text-on-surface">{person.basicSalary === null ? "—" : formatMoney(person.basicSalary)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden w-full overflow-x-auto md:block">
        <table className="data-table w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr>
              <th className={`${header} pl-2`}>Employee Code</th>
              <th className={header}>Name</th>
              <th className={header}>Phone No.</th>
              <th className={header}>Department</th>
              <th className={header}>Agent Name</th>
              <th className={`${header} pr-2 text-right`}>Basic Salary</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {sorted.map((person) => (
              <tr key={person.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface">
                <td className="py-3 pl-2 font-mono text-xs text-on-surface-variant">{person.employeeNumber}</td>
                <td className="py-3 font-semibold">
                  {employeeHref ? (
                    <Link href={employeeHref(person.id)} className="text-primary hover:underline">
                      {person.fullName}
                    </Link>
                  ) : (
                    person.fullName
                  )}
                </td>
                <td className="py-3 tabular-nums text-on-surface-variant">{person.phone ?? "—"}</td>
                <td className="py-3 text-on-surface-variant">{person.departmentName ?? "—"}</td>
                <td className="py-3 text-on-surface-variant">{person.agentName ?? "—"}</td>
                <td className="py-3 pr-2 text-right tabular-nums">
                  {person.basicSalary === null ? "—" : formatMoney(person.basicSalary)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BentoCard>
  );
}
