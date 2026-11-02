import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AssignBranchForm, UserRow } from "@/components/features/users/user-rows";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getUsers } from "@/lib/api/user";
import type { BranchResponse, UserSummaryResponse } from "@/types";

/** One branch's accounts: its Branch Managers and its Back Office officers. */
export default async function UserBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("user:manage");

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

  const here = users.filter((user) => user.branchId === branchId);
  const managers = here.filter((user) => user.role === "BRANCH_MANAGER");
  const backOffice = here.filter((user) => user.role === "BACK_OFFICE");
  const branchOptions = branches.map((item) => ({ id: item.id, name: item.name }));

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/admin/users"
              aria-label="Back to users"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            <span className="min-w-0 break-words">{branch.name}</span>
          </span>
        }
        pill={<StatusBadge status={branch.status} />}
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <BentoCard title="Branch Managers" subtitle={`${managers.length} account${managers.length === 1 ? "" : "s"}`}>
          {managers.length === 0 ? (
            <EmptyState symbol="person_off" title="No Branch Manager" description="No Branch Manager account is linked to this branch." />
          ) : (
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {managers.map((user) => (
                <li key={user.id} className="py-3 first:pt-0 last:pb-0">
                  <UserRow user={user} canDelete={user.id !== session.userId} />
                </li>
              ))}
            </ul>
          )}
        </BentoCard>

        <BentoCard title="Back Office" subtitle={`${backOffice.length} account${backOffice.length === 1 ? "" : "s"}`}>
          {backOffice.length === 0 ? (
            <EmptyState symbol="person_off" title="No Back Office officer" description="Assign one from the Users page." />
          ) : (
            <ul className="flex flex-col divide-y divide-outline-variant/30">
              {backOffice.map((user) => (
                <li key={user.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
                  <UserRow user={user} canDelete={user.id !== session.userId} />
                  <AssignBranchForm userId={user.id} currentBranchId={user.branchId} branches={branchOptions} />
                </li>
              ))}
            </ul>
          )}
        </BentoCard>
      </div>
    </>
  );
}
