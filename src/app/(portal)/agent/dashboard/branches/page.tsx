import { requirePermission } from "@/app/lib/dal";
import { BranchCards, existingEmployees } from "@/components/features/employee/branch-directory";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getBranches } from "@/lib/api/branch";
import { getMyBranchDirectory } from "@/lib/api/employee";

/** Dashboard → Branches: a card per branch, counting only this agent's own employees. */
export default async function AgentDashboardBranchesPage() {
  await requirePermission("agent:read:self");

  let branches: Awaited<ReturnType<typeof getBranches>>;
  try {
    branches = await getBranches();
  } catch (error) {
    return <DataUnavailable title="Branches" subject="The branch list" reason={error instanceof Error ? error.message : undefined} />;
  }

  const lists = await Promise.allSettled(branches.map((branch) => getMyBranchDirectory(branch.id)));

  return (
    <>
      <PageHeader title="Branches" description="Open a branch to see your employees there." />
      <BranchCards
        basePath="/agent/dashboard/branches"
        items={branches.map((branch, index) => {
          const list = lists[index];
          return { branch, employeeCount: list?.status === "fulfilled" ? existingEmployees(list.value).length : null };
        })}
      />
    </>
  );
}
