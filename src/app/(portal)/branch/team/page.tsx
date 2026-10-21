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
import { getMyBranch } from "@/lib/api/branch";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { formatNumber, initials } from "@/lib/format";

/** My Team — the employees of the branch manager's own branch. */
export default async function BranchTeamPage() {
  await requirePermission("employee:read:branch");

  let branch: Awaited<ReturnType<typeof getMyBranch>>;
  let team: Awaited<ReturnType<typeof getEmployeesByBranch>>;
  try {
    branch = await getMyBranch();
    team = await getEmployeesByBranch(branch.id);
  } catch (error) {
    return (
      <DataUnavailable
        title="My Team"
        subject="Your team"
        reason={
          error instanceof ApiError
            ? error.message
            : "Your account may not be assigned to a branch yet — ask an Admin."
        }
      />
    );
  }

  const sorted = [...team].sort((a, b) => a.fullName.localeCompare(b.fullName));
  const active = sorted.filter((person) => person.employmentStatus === "ACTIVE").length;

  return (
    <>
      <PageHeader
        title="My Team"
        description={`Managing personnel for ${branch.name}.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/branch/requests" className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-body-md text-body-md font-semibold text-primary transition-colors hover:bg-primary-fixed">
              My Requests
            </Link>
            <Link href="/branch/team/new" className="flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-bold text-on-primary transition-opacity hover:opacity-90">
              <Icon name="person_add" className="text-sm" />
              Add Employee
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <MetricCard label="Employees" value={formatNumber(sorted.length)} icon="group" tone="primary" />
        <MetricCard label="Active" value={formatNumber(active)} icon="check_circle" tone="primary" />
        <MetricCard label="Not Active" value={formatNumber(sorted.length - active)} icon="person_off" tone="primary" />
      </div>

      <BentoCard className="mt-gutter" title="Team Directory">
        {sorted.length === 0 ? (
          <EmptyState symbol="group_off" title="No employees yet" description="Add your first employee — an Admin approves it before they appear here." />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="data-table w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                  <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Position</th>
                  <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {sorted.map((person) => (
                  <tr key={person.id} className="group border-b border-surface-variant transition-colors last:border-0 hover:bg-background">
                    <td className="py-4 pl-2">
                      <Link href={`/branch/team/${person.id}`} className="flex items-center gap-3">
                        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container">{initials(person.fullName)}</span>
                        <span>
                          <span className="block font-semibold text-on-surface transition-colors group-hover:text-primary">{person.fullName}</span>
                          <span className="block text-[10px] text-on-surface-variant">{person.employeeNumber}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-4 text-on-surface-variant">{person.position ?? "—"}</td>
                    <td className="py-4 pr-2 text-right"><StatusBadge status={person.employmentStatus} /></td>
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