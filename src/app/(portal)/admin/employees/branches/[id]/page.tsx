import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BranchEmployeesTable } from "@/components/features/employee/branch-directory";
import { EmployeeExportButtons } from "@/components/features/employee/employee-export-buttons";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { hasPermission } from "@/config/roles";
import { getBranch } from "@/lib/api/branch";
import { getBranchDirectory } from "@/lib/api/employee";

/** One branch's employees, reached from the Employees page in the sidebar. */
export default async function AdminBranchEmployeesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("employee:read");

  const branchId = Number((await params).id);
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
          <span className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/employees"
              aria-label="Back to employees"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            <span className="min-w-0 break-words">{data.branch.name}</span>
          </span>
        }
        actions={<div className="flex flex-wrap gap-3"><EmployeeExportButtons branchId={branchId} /></div>}
      />
      <BranchEmployeesTable
        employees={data.employees}
        employeeHref={(employeeId) => `/admin/employees/${employeeId}`}
        emptyDescription="No employees in this branch yet."
        bulkDelete={hasPermission(session.role, "employee:write")}
      />
    </>
  );
}
