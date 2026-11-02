import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@/app/lib/dal";
import { BranchEmployeesTable } from "@/components/features/employee/branch-directory";
import { EmployeeExportButtons } from "@/components/features/employee/employee-export-buttons";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getMyBranchDirectory } from "@/lib/api/employee";

/** This agent's own employees in one branch. */
export default async function AgentDashboardBranchEmployeesPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("agent:read:self");

  const { id } = await params;
  const branchId = Number(id);
  if (!Number.isInteger(branchId) || branchId <= 0) notFound();

  let data: { branches: Awaited<ReturnType<typeof getBranches>>; employees: Awaited<ReturnType<typeof getMyBranchDirectory>> };
  try {
    // An agent may list branches but not read one by id, so the name comes from the list.
    const [branches, employees] = await Promise.all([getBranches(), getMyBranchDirectory(branchId)]);
    data = { branches, employees };
  } catch (error) {
    return <DataUnavailable title="Branch employees" subject="Your employees in this branch" reason={error instanceof Error ? error.message : undefined} />;
  }

  const branch = data.branches.find((item) => item.id === branchId);
  if (!branch) notFound();

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/agent/dashboard/branches"
              aria-label="Back to branches"
              className="flex size-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            {branch.name}
          </span>
        }
        actions={<div className="flex flex-wrap gap-3"><EmployeeExportButtons branchId={branchId} /></div>}
      />
      <BranchEmployeesTable employees={data.employees} emptyDescription="You have no employees in this branch." />
    </>
  );
}
