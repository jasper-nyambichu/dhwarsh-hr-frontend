import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BranchCards, existingEmployees } from "@/components/features/employee/branch-directory";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getBranches } from "@/lib/api/branch";
import { getBranchDirectory } from "@/lib/api/employee";

/** Dashboard → Branches: a card per branch; opening one lists its employees. */
export default async function AdminDashboardBranchesPage() {
  await requirePermission("employee:read");

  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    branches = await getBranches();
  } catch (error) {
    return <DataUnavailable title="Branches" subject="The branch list" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const lists = await Promise.allSettled(branches.map((branch) => getBranchDirectory(branch.id)));

  return (
    <>
      <PageHeader title="Branches" description="Open a branch to see its employees." />
      <BranchCards
        basePath="/admin/dashboard/branches"
        items={branches.map((branch, index) => {
          const list = lists[index];
          return { branch, employeeCount: list?.status === "fulfilled" ? existingEmployees(list.value).length : null };
        })}
      />
    </>
  );
}
