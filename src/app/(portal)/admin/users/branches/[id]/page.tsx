import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { CredentialCard } from "@/components/features/users/credential-card";
import { MoveBranchManagerForm } from "@/components/features/users/move-branch-manager-form";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getUsers } from "@/lib/api/user";
import type { BranchResponse, UserSummaryResponse } from "@/types";

const LOGINS = [
  { role: "BRANCH_MANAGER", title: "Branch Manager", subtitle: "Opens this branch's portal." },
  { role: "BACK_OFFICE", title: "Back Office", subtitle: "Sees this branch only." },
] as const;

/** One branch's logins: its Branch Manager and its Back Office. */
export default async function UserBranchPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("user:manage");

  const branchId = Number((await params).id);
  if (!Number.isInteger(branchId) || branchId <= 0) notFound();

  let users: UserSummaryResponse[];
  let branches: BranchResponse[];
  try {
    [users, branches] = await Promise.all([getUsers(), getBranches()]);
  } catch (error) {
    return <DataUnavailable title="Branch accounts" subject="This branch's accounts" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const branch = branches.find((item) => item.id === branchId);
  if (!branch) notFound();

  const moveOptions = branches
    .filter((other) => other.status === "ACTIVE" && other.id !== branchId)
    .map((other) => ({
      id: other.id,
      name: other.name,
      manager: users.find((user) => user.role === "BRANCH_MANAGER" && user.branchId === other.id)?.username ?? null,
    }));

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/admin/users/branches"
              aria-label="Back to branches"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            <span className="min-w-0 break-words">{branch.name}</span>
          </span>
        }
        pill={<StatusBadge status={branch.status} />}
      />

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-2">
        {LOGINS.flatMap(({ role, title, subtitle }) => {
          const accounts = users.filter((user) => user.role === role && user.branchId === branchId);

          // A branch normally has one of each. Older data can hold more, and each stays manageable.
          // The first card keeps its key once its login exists, so the credentials to share stay on screen.
          return (accounts.length > 0 ? accounts : [null]).map((user, index) => (
            <CredentialCard
              key={index === 0 ? role : user?.id}
              title={title}
              subtitle={subtitle}
              where={`${branch.name} as ${title}`}
              account={user}
              branchId={branchId}
              role={role}
            >
              {role === "BRANCH_MANAGER" && user?.active ? (
                <MoveBranchManagerForm userId={user.id} username={user.username} currentBranch={branch.name} branches={moveOptions} />
              ) : null}
            </CredentialCard>
          ));
        })}
      </div>
    </>
  );
}
