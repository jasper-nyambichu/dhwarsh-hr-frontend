import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getUsers } from "@/lib/api/user";
import type { BranchResponse, UserSummaryResponse } from "@/types";

function Login({ label, icon, users }: { label: string; icon: string; users: UserSummaryResponse[] }) {
  return (
    <span className="flex min-w-0 items-start gap-2">
      <Icon name={icon} className="mt-0.5 shrink-0 text-[18px] text-outline" />
      <span className="min-w-0">
        <span className="block font-table-header text-table-header uppercase text-outline">{label}</span>
        <span className={`block break-all text-sm ${users.length > 0 ? "font-mono text-on-surface" : "text-amber-main"}`}>
          {users.length > 0 ? users.map((user) => user.username).join(", ") : "Not set"}
        </span>
      </span>
    </span>
  );
}

/** Every branch, and whether its two logins have been set. */
export default async function UserBranchesPage() {
  await requirePermission("user:manage");

  let users: UserSummaryResponse[];
  let branches: BranchResponse[];
  try {
    [users, branches] = await Promise.all([getUsers(), getBranches()]);
  } catch (error) {
    return <DataUnavailable title="Branches" subject="The branch logins" reason={error instanceof ApiError ? error.message : undefined} />;
  }

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
            Branches
          </span>
        }
        description="Open a branch to set its Branch Manager and Back Office logins."
      />

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
                <Login label="Branch Manager" icon="supervisor_account" users={users.filter((user) => user.role === "BRANCH_MANAGER" && user.branchId === branch.id)} />
                <Login label="Back Office" icon="fingerprint" users={users.filter((user) => user.role === "BACK_OFFICE" && user.branchId === branch.id)} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
