import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BranchCards, existingEmployees } from "@/components/features/employee/branch-directory";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getBranchDirectory } from "@/lib/api/employee";

/** Accounts Office → Employees: a card per branch with its headcount; opening one lists its employees. */
export default async function AccountsEmployeesPage() {
  await requirePermission("branch:read");

  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    branches = await getBranches();
  } catch (error) {
    return <DataUnavailable title="Employees" subject="The branch list" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const lists = await Promise.allSettled(branches.map((branch) => getBranchDirectory(branch.id)));

  return (
    <>
      <PageHeader
        title="Employees"
        description="Employees of every branch. Open a branch to see its employees."
        actions={
          <Link href="/accounts/employees/new" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm hover:bg-primary-container">
            <Icon name="person_add" className="text-[18px]" />
            Add Employee
          </Link>
        }
      />
      <BranchCards
        basePath="/accounts/employees/branches"
        items={branches.map((branch, index) => {
          const list = lists[index];
          return { branch, employeeCount: list?.status === "fulfilled" ? existingEmployees(list.value).length : null };
        })}
      />
    </>
  );
}
