import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AssignBranchForm, UserRow } from "@/components/features/users/user-rows";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { ROLES } from "@/config/roles";
import { getBranches } from "@/lib/api/branch";
import { getUsers } from "@/lib/api/user";
import type { BranchResponse, UserSummaryResponse } from "@/types";

/** Names on a branch card, or a plain note that there is nobody yet. */
function People({ label, icon, users }: { label: string; icon: string; users: UserSummaryResponse[] }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon name={icon} className="mt-0.5 shrink-0 text-[18px] text-outline" />
      <div className="min-w-0">
        <p className="font-table-header text-table-header uppercase text-outline">{label}</p>
        <p className={`break-words text-sm ${users.length > 0 ? "text-on-surface" : "text-amber-main"}`}>
          {users.length > 0 ? users.map((user) => user.displayName ?? user.username).join(", ") : "None yet"}
        </p>
      </div>
    </div>
  );
}

/**
 * Accounts, organised the way the business is: a card per branch, holding its Branch Managers and
 * Back Office officers. Accounts that belong to no branch (Admin, Agent) sit underneath. Accounts on
 * retired roles are all deactivated and are left out.
 */
export default async function SystemUsersPage() {
  const session = await requirePermission("user:manage");

  let users: UserSummaryResponse[];
  let branches: BranchResponse[];

  try {
    [users, branches] = await Promise.all([getUsers(), getBranches()]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");

    return (
      <DataUnavailable
        title="Users"
        description="Branch Managers and Back Office officers, by branch."
        subject="The user directory"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const current = users.filter((user) => ROLES.includes(user.role));
  const inBranch = (user: UserSummaryResponse, branchId: number) => user.branchId === branchId;
  const needsBranch = current.filter((user) => user.role === "BACK_OFFICE" && user.branchId === null);
  const managersWithoutBranch = current.filter((user) => user.role === "BRANCH_MANAGER" && user.branchId === null);
  const companyWide = current.filter((user) => user.role !== "BACK_OFFICE" && user.role !== "BRANCH_MANAGER");
  const branchOptions = branches.map((branch) => ({ id: branch.id, name: branch.name }));

  return (
    <>
      <PageHeader
        title="Users"
        description="Open a branch to see its Branch Managers and Back Office officers."
        pill={<CountPill label={`${current.filter((user) => user.active).length} Active`} />}
      />

      <div className="flex flex-col gap-gutter">
        {needsBranch.length > 0 ? (
          <BentoCard title="Back Office without a branch" subtitle="Choose a branch so they show under it. Their access does not change.">
            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {needsBranch.map((user) => (
                <li key={user.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-amber-main/40 p-3">
                  <UserRow user={user} canDelete={user.id !== session.userId} />
                  <AssignBranchForm userId={user.id} currentBranchId={null} branches={branchOptions} />
                </li>
              ))}
            </ul>
          </BentoCard>
        ) : null}

        <section aria-labelledby="user-branches" className="flex flex-col gap-3">
          <h2 id="user-branches" className="font-table-header text-table-header uppercase text-outline">Branches</h2>
          {branches.length === 0 ? (
            <div className="bento-card p-4 sm:p-card-padding">
              <EmptyState symbol="location_off" title="No branches yet" description="Branches appear here once they have been created." />
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
              {branches.map((branch) => (
                <li key={branch.id} className="flex min-w-0">
                  <Link
                    href={`/admin/users/branches/${branch.id}`}
                    className="bento-card group flex w-full min-w-0 flex-col gap-4 p-4 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-card-padding"
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                        <Icon name="account_balance" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words font-semibold text-on-surface group-hover:text-primary-container">{branch.name}</span>
                        <span className="mt-1 block"><StatusBadge status={branch.status} /></span>
                      </span>
                      <Icon name="chevron_right" className="shrink-0 text-outline" />
                    </span>
                    <People label="Branch Managers" icon="supervisor_account" users={current.filter((user) => user.role === "BRANCH_MANAGER" && inBranch(user, branch.id))} />
                    <People label="Back Office" icon="fingerprint" users={current.filter((user) => user.role === "BACK_OFFICE" && inBranch(user, branch.id))} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {companyWide.length + managersWithoutBranch.length > 0 ? (
          <BentoCard title="Company-wide accounts" subtitle="Accounts that do not belong to one branch">
            <ul className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
              {[...companyWide, ...managersWithoutBranch].map((user) => (
                <li key={user.id} className="min-w-0">
                  <UserRow user={user} showRole canDelete={user.id !== session.userId} />
                </li>
              ))}
            </ul>
          </BentoCard>
        ) : null}
      </div>
    </>
  );
}
