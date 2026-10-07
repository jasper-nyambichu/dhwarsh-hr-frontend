import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { getCurrentUser, requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { ROLE_LABEL, type Role } from "@/config/roles";
import { getBranches } from "@/lib/api/branch";
import { getUsers } from "@/lib/api/user";
import { formatNumber, initials } from "@/lib/format";
import type { BranchResponse, UserSummaryResponse } from "@/types";

/**
 * System users directory, read from `GET /users`.
 *
 * Two placeholder columns are gone because `users` has no column for them:
 * **Last Login** (`last_login_at` does not exist) and **MFA**
 * (`mfa_enabled` does not exist). The "MFA Enrollment" warning card went with
 * them — it reported a non-compliance count for a setting the system cannot
 * observe, which is the most misleading shape a fake metric can take: an
 * administrator would act on it. The avatar URLs were stock demo images and are
 * replaced with initials.
 *
 * "Invite User" is **SUPER_ADMIN only**. `POST /users` is
 * `hasRole('SUPER_ADMIN')` while `GET /users` admits ADMIN, so an ADMIN sees
 * the directory but not the invite control. Hiding it is deliberate: the
 * alternative is a button that 403s.
 */

const DONUT_COLORS = [
  "var(--color-primary)",
  "#b7f568",
  "#aec9eb",
  "#ffdad6",
  "var(--color-amber-main)",
  "var(--color-chart-track)",
];

export default async function SystemUsersPage() {
  await requirePermission("user:manage");

  const viewer = await getCurrentUser();

  let users: UserSummaryResponse[];
  let branches: BranchResponse[];

  try {
    [users, branches] = await Promise.all([getUsers(), getBranches()]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");

    return (
      <DataUnavailable
        title="Manage Users"
        description="View and manage system access for all personnel."
        subject="The user directory"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  const activeCount = users.filter((u) => u.active).length;

  // Real distribution, counted from the rows above rather than a literal.
  const byRole = new Map<Role, number>();
  for (const user of users) {
    byRole.set(user.role, (byRole.get(user.role) ?? 0) + 1);
  }
  const roleBreakdown = [...byRole.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([role, count], index) => ({
      label: ROLE_LABEL[role],
      value: count,
      color: DONUT_COLORS[index % DONUT_COLORS.length],
    }));

  const canInvite = viewer.role === "SUPER_ADMIN";

  return (
    <>
      <PageHeader
        title="Manage Users"
        description="View and manage system access for all personnel."
        pill={<CountPill label={`${activeCount} Active`} />}
        actions={
          canInvite ? (
            <button
              type="button"
              className="bento-shadow flex items-center gap-2 rounded-lg bg-[#0B2A45] px-4 py-2.5 font-body-md text-body-md font-medium text-on-primary transition-colors hover:bg-primary"
            >
              <Icon name="add" className="text-[18px]" />
              Invite User
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ─────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter xl:col-span-8">
          <BentoCard
            title="Active Personnel"
            subtitle={`${formatNumber(users.length)} ${
              users.length === 1 ? "account" : "accounts"
            } on this deployment`}
          >
            {users.length === 0 ? (
              <EmptyState
                symbol="person_off"
                title="No user accounts"
                description="Accounts appear here once they have been created."
              />
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="data-table w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/30 bg-surface/30">
                      <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">
                        User
                      </th>
                      <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">
                        Role
                      </th>
                      <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">
                        Branch
                      </th>
                      <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-on-surface">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-outline-variant/10 transition-colors last:border-0 hover:bg-surface/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container shadow-sm">
                              {initials(user.displayName ?? user.username)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-medium text-on-surface">
                                {user.displayName ?? "—"}
                              </div>
                              <div className="font-mono text-[10px] text-on-surface-variant">
                                {user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md bg-surface-container-highest px-2 py-0.5 text-[10px] font-medium text-on-surface">
                            {ROLE_LABEL[user.role] ?? user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {user.branchId === null
                            ? "—"
                            : (branchName.get(user.branchId) ??
                              `Branch #${user.branchId}`)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`size-1.5 rounded-full ${
                                user.active ? "bg-tertiary-fixed-dim" : "bg-error"
                              }`}
                            />
                            <span
                              className={`text-[11px] font-medium ${
                                user.active
                                  ? "text-tertiary-fixed-dim"
                                  : "text-error"
                              }`}
                            >
                              {user.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        </div>

        {/* ────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter xl:col-span-4">
          <BentoCard title="Users by Role" subtitle="Distribution of system access">
            {roleBreakdown.length === 0 ? (
              <p className="py-4 text-center font-body-md text-body-md text-outline">
                No accounts to summarise.
              </p>
            ) : (
              <div className="flex flex-col items-center">
                <DonutChart segments={roleBreakdown} centerLabel="Total" />
                <div className="mt-6 grid w-full grid-cols-2 gap-x-2 gap-y-3 font-body-md text-[11px]">
                  {roleBreakdown.map((segment) => (
                    <div key={segment.label} className="flex items-center gap-2">
                      <div
                        className="size-3 shrink-0 rounded"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="min-w-0 truncate text-on-surface">
                        {segment.label} ({segment.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </BentoCard>

          <BentoCard title="Account Status">
            <div className="flex items-baseline gap-2">
              <span className="font-card-stat text-card-stat tabular-nums text-on-surface">
                {formatNumber(activeCount)}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                of {formatNumber(users.length)} active
              </span>
            </div>
            {users.length - activeCount > 0 ? (
              <p className="mt-3 text-[11px] text-error">
                {formatNumber(users.length - activeCount)} deactivated — these
                accounts cannot sign in.
              </p>
            ) : (
              <p className="mt-3 text-[11px] text-on-surface-variant">
                Every account is active.
              </p>
            )}
            <p className="mt-4 border-t border-outline-variant/40 pt-3 text-[10px] text-outline">
              Deactivating an account is available to the platform owner only.
            </p>
          </BentoCard>
        </div>
      </div>
    </>
  );
}
