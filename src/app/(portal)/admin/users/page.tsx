//src/app/(portal)/admin/users/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatNumber } from "@/lib/format";

/**
 * System Users directory.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.User` plus the aggregate
 * columns (role, branch, last login, MFA) the list view needs. Backend will
 * need to supply this as a projection, same as the branches list.
 * ─────────────────────────────────────────────────────────────────────────
 */

type UserRole = "SUPER_ADMIN" | "HR_MANAGER" | "FINANCE" | "RECRUITER";

type UserRow = {
  id: number;
  name: string;
  handle: string;
  avatarUrl: string | null;
  initials: string;
  role: UserRole;
  branch: string;
  lastLogin: string;
  mfaEnabled: boolean;
  status: "ACTIVE" | "SUSPENDED";
};

const USERS: readonly UserRow[] = [
  { id: 1, name: "Sarah Jenkins", handle: "@sjenkins", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDI1s7UV4VCWbWUv5PuiQJ72_Bz_bVNlsT6krXj-Db3TJL6cxEE0P7grEfDdMf9H6bo0TbGmX-jF7JLgawCicIs436-Uy1E2FuJKMg0a82UyC941UXJ2oFhRdA_-e4yJYD-GNMVkpLih9YUGYe3pUqG9R9TGh384CF3MeKlaK1UTeew_944aQB1lXNVjtlVWf2at_8f8hPyuBUCOruJwaKyIT-brpAVzHQjS0xcxC_jsO92uNG_My2y", initials: "SJ", role: "SUPER_ADMIN", branch: "HQ - Nairobi", lastLogin: "Today, 09:41 AM", mfaEnabled: true, status: "ACTIVE" },
  { id: 2, name: "Marcus Kiptoo", handle: "@mkiptoo", avatarUrl: null, initials: "MK", role: "HR_MANAGER", branch: "Mombasa Branch", lastLogin: "Yesterday, 14:20", mfaEnabled: true, status: "ACTIVE" },
  { id: 3, name: "David Omondi", handle: "@domondi", avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrA7xOTxqvtPsrrySiYwG9zgV8yOwkekuIfocKzkw13Ig2y_J9X5jEobd9NFIC8pZzm5O0Bp3HV1rBu2soHy_b7RH5_UZzBhkBZC8MorgshvHm73uKnsTzKC5GvDK2-hk28A4GwboJSxIJBY0D_UXcXqD1a7OjhIJ4KT7PdRJcXuYC3q2fBGTeNiiVeyQnOYqLR2Yn91K790N2KlwzumSxpABoB-NlGjInsDuCJ3fJ-NKJM0URrIQW", initials: "DO", role: "FINANCE", branch: "HQ - Nairobi", lastLogin: "Oct 24, 08:15 AM", mfaEnabled: false, status: "ACTIVE" },
  { id: 4, name: "Amina Ndungu", handle: "@andung", avatarUrl: null, initials: "AN", role: "RECRUITER", branch: "Kisumu Branch", lastLogin: "Sep 12, 11:30 AM", mfaEnabled: false, status: "SUSPENDED" },
];

const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  SUPER_ADMIN: { label: "Super Admin", className: "bg-[#E6F0F8] text-[#1C6EB4] border border-[#1C6EB4]/20" },
  HR_MANAGER: { label: "HR Manager", className: "bg-surface-container-highest text-on-surface" },
  FINANCE: { label: "Finance", className: "bg-secondary-container/50 text-secondary" },
  RECRUITER: { label: "Recruiter", className: "bg-surface-container-highest text-on-surface" },
};

const ROLE_BREAKDOWN = [
  { label: "HR Manager", value: 17, color: "var(--color-primary)" },
  { label: "Employee", value: 12, color: "#b7f568" },
  { label: "Finance", value: 8, color: "#aec9eb" },
  { label: "Super Admin", value: 5, color: "#ffdad6" },
];

const MFA_NON_COMPLIANT_COUNT = 8;

export default async function SystemUsersPage() {
  await requirePermission("user:manage");

  const activeCount = USERS.filter((u) => u.status === "ACTIVE").length;
  const total = ROLE_BREAKDOWN.reduce((sum, r) => sum + r.value, 0);

  return (
    <>
      <PageHeader
        title="Manage Users"
        description="View and manage system access for all personnel."
        pill={<CountPill label={`${activeCount} Active`} />}
        actions={
          <Link
            href="/admin/users/invite"
            className="bento-shadow flex items-center gap-2 rounded-lg bg-[#0B2A45] px-4 py-2.5 font-body-md text-body-md font-medium text-on-primary transition-colors hover:bg-primary"
          >
            <Icon name="add" className="text-[18px]" />
            Invite User
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ─────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter xl:col-span-8">
          <BentoCard
            title="Active Personnel"
            action={
              <div className="flex gap-2">
                <div className="relative">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline"
                  />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-48 rounded-lg border border-outline-variant/50 bg-surface py-1.5 pl-9 pr-3 font-body-md text-sm transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-lg border border-outline-variant/50 p-1.5 text-on-surface-variant transition-colors hover:bg-surface"
                >
                  <Icon name="filter_list" className="text-[18px]" />
                </button>
              </div>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface/30">
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">User</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Role</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Branch</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Last Login</th>
                    <th className="px-4 py-3 text-center font-table-header text-table-header uppercase text-on-surface-variant">MFA</th>
                    <th className="px-4 py-3 font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                    <th className="px-4 py-3 text-right font-table-header text-table-header uppercase text-on-surface-variant">Action</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-on-surface">
                  {USERS.map((user) => {
                    const badge = ROLE_BADGE[user.role];
                    const active = user.status === "ACTIVE";

                    return (
                      <tr
                        key={user.id}
                        className="group border-b border-outline-variant/10 transition-colors hover:bg-surface/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="size-9 shrink-0 rounded-full object-cover shadow-sm"
                              />
                            ) : (
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container shadow-sm">
                                {user.initials}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-on-surface">{user.name}</div>
                              <div className="text-[10px] text-on-surface-variant">{user.handle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">{user.branch}</td>
                        <td className="px-4 py-3 text-[11px] text-on-surface-variant">{user.lastLogin}</td>
                        <td className="px-4 py-3 text-center">
                          <Icon
                            name={user.mfaEnabled ? "lock" : "lock_open"}
                            className={`text-[16px] ${user.mfaEnabled ? "text-tertiary" : "text-outline"}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`size-1.5 rounded-full ${active ? "bg-tertiary-fixed-dim" : "bg-error"}`} />
                            <span className={`text-[11px] font-medium ${active ? "text-tertiary-fixed-dim" : "text-error"}`}>
                              {active ? "Active" : "Suspended"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1 text-on-surface-variant opacity-0 transition-colors hover:text-primary group-hover:opacity-100">
                            <Icon name="more_vert" className="text-[18px]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4 text-[11px] text-on-surface-variant">
              <span>Showing {USERS.length} of 42 entries</span>
              <div className="flex gap-1">
                <button className="rounded border border-outline-variant/50 px-2 py-1 transition-colors hover:bg-surface disabled:opacity-50">Prev</button>
                <button className="rounded bg-primary px-2 py-1 text-white shadow-sm">1</button>
                <button className="rounded border border-outline-variant/50 px-2 py-1 transition-colors hover:bg-surface">2</button>
                <button className="rounded border border-outline-variant/50 px-2 py-1 transition-colors hover:bg-surface">3</button>
                <button className="rounded border border-outline-variant/50 px-2 py-1 transition-colors hover:bg-surface">Next</button>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* ────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter xl:col-span-4">
          <BentoCard title="Users by Role" subtitle="Distribution of system access">
            <div className="flex flex-col items-center">
              <DonutChart segments={ROLE_BREAKDOWN} centerLabel="Total" />
              <div className="mt-6 grid w-full grid-cols-2 gap-x-2 gap-y-3 font-body-md text-[11px]">
                {ROLE_BREAKDOWN.map((segment) => (
                  <div key={segment.label} className="flex items-center gap-2">
                    <div className="size-3 rounded" style={{ backgroundColor: segment.color }} />
                    <span className="text-on-surface">
                      {segment.label} ({segment.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          <div className="bento-shadow rounded-card border-l-4 border-error/80 bg-error-container/30 p-4">
            <div className="flex items-start gap-3">
              <Icon name="security_update_warning" className="mt-0.5 text-error" />
              <div>
                <h4 className="text-[13px] font-medium text-on-surface">MFA Enrollment</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
                  {MFA_NON_COMPLIANT_COUNT} users have not enabled Multi-Factor Authentication. It is
                  recommended to enforce this policy for all roles with financial access.
                </p>
                <Link href="/admin/users?mfa=non-compliant" className="mt-2 inline-block text-[11px] font-semibold text-primary hover:underline">
                  View Non-Compliant Users
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}