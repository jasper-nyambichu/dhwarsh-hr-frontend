import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BranchEmployeesTable } from "@/components/features/employee/branch-directory";
import { EmployeeExportButtons } from "@/components/features/employee/employee-export-buttons";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getBranch } from "@/lib/api/branch";
import { getBranchDirectory } from "@/lib/api/employee";

/** One branch's employees, with their basic salary. */
export default async function AdminDashboardBranchEmployeesPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("employee:read");

  const { id } = await params;
  const branchId = Number(id);
  if (!Number.isInteger(branchId) || branchId <= 0) notFound();

  let data: { branch: Awaited<ReturnType<typeof getBranch>>; employees: Awaited<ReturnType<typeof getBranchDirectory>> };
  try {
    const [branch, employees] = await Promise.all([getBranch(branchId), getBranchDirectory(branchId)]);
    data = { branch, employees };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <DataUnavailable title="Branch employees" subject="This branch's employees" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/admin/dashboard/branches"
              aria-label="Back to branches"
              className="flex size-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            {data.branch.name}
          </span>
        }
        actions={<div className="flex flex-wrap gap-3"><EmployeeExportButtons branchId={branchId} /></div>}
      />
      <BranchEmployeesTable
        employees={data.employees}
        employeeHref={(employeeId) => `/admin/employees/${employeeId}`}
        emptyDescription="No employees in this branch yet."
      />
    </>
  );
}
