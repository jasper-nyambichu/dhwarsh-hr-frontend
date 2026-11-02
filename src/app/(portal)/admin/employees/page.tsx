import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BranchCards, existingEmployees } from "@/components/features/employee/branch-directory";
import { EmployeeExportButtons } from "@/components/features/employee/employee-export-buttons";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getBranchDirectory } from "@/lib/api/employee";
import { formatNumber } from "@/lib/format";

/** Sidebar → Employees: a card per branch; opening one lists its employees. */
export default async function AdminEmployeesPage() {
  await requirePermission("employee:read");

  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    branches = await getBranches();
  } catch (error) {
    return <DataUnavailable title="Employees" subject="The branch list" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const lists = await Promise.allSettled(branches.map((branch) => getBranchDirectory(branch.id)));
  const items = branches.map((branch, index) => {
    const list = lists[index];
    return { branch, employeeCount: list?.status === "fulfilled" ? existingEmployees(list.value).length : null };
  });
  const total = items.reduce((sum, item) => sum + (item.employeeCount ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Employees"
        description="Open a branch to see its employees."
        pill={<CountPill label={`${formatNumber(total)} total`} />}
        actions={
          <div className="flex flex-wrap gap-3">
            <EmployeeExportButtons />
            <Link href="/admin/employees/new" className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body-md text-body-md font-bold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant">
              <Icon name="person_add" className="text-[18px]" />
              Add Employee
            </Link>
          </div>
        }
      />
      <BranchCards basePath="/admin/employees/branches" items={items} />
    </>
  );
}
