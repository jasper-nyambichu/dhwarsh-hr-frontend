import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { getBranches } from "@/lib/api/branch";
import { getUsers } from "@/lib/api/user";

import { BranchForm } from "../_components/branch-form";

/** Add a branch. */
export default async function NewBranchPage() {
  await requirePermission("branch:write");

  let managers: { id: number; name: string }[];
  try {
    const [users, branches] = await Promise.all([getUsers(), getBranches()]);
    const taken = new Set(branches.map((branch) => branch.managerId).filter((id): id is number => id !== null));
    managers = users
      .filter((user) => user.role === "BRANCH_MANAGER" && user.active && !taken.has(user.id))
      .map((user) => ({ id: user.id, name: user.displayName ?? user.username }));
  } catch (error) {
    return (
      <DataUnavailable
        title="Add Branch"
        subject="The branch manager list"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  return (
    <>
      <PageHeader title="Add Branch" description="Create a new location. You can assign a manager now or later." />
      <BranchForm mode="create" managers={managers} />
    </>
  );
}