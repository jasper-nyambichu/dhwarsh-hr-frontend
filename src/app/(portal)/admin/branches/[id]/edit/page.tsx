import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { hasPermission } from "@/config/roles";
import { getBranch, getBranches } from "@/lib/api/branch";
import { getUsers } from "@/lib/api/user";

import { BranchForm } from "../../_components/branch-form";
import { BranchStatusButton } from "../../_components/branch-status-button";

/** Edit a branch. Activate / deactivate is offered to Super Admin only. */
export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("branch:write");

  const { id } = await params;
  const branchId = Number(id);
  if (!Number.isInteger(branchId) || branchId <= 0) notFound();

  let data: {
    branch: Awaited<ReturnType<typeof getBranch>>;
    managers: { id: number; name: string }[];
  };

  try {
    const [branch, branches, users] = await Promise.all([getBranch(branchId), getBranches(), getUsers()]);
    const takenElsewhere = new Set(
      branches
        .filter((other) => other.id !== branchId)
        .map((other) => other.managerId)
        .filter((managerId): managerId is number => managerId !== null),
    );
    const managers = users
      .filter(
        (user) =>
          user.role === "BRANCH_MANAGER" &&
          (user.active || user.id === branch.managerId) &&
          !takenElsewhere.has(user.id),
      )
      .map((user) => ({ id: user.id, name: user.displayName ?? user.username }));
    data = { branch, managers };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return (
      <DataUnavailable
        title="Edit Branch"
        subject="This branch"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const canChangeStatus = session.role === "SUPER_ADMIN" && hasPermission(session.role, "branch:write");

  return (
    <>
      <PageHeader title={`Edit ${data.branch.name}`} description={`Branch code ${data.branch.code}`} />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-gutter">
        <BranchForm mode="edit" initial={data.branch} managers={data.managers} />
        {canChangeStatus ? <BranchStatusButton id={data.branch.id} status={data.branch.status} /> : null}
      </div>
    </>
  );
}