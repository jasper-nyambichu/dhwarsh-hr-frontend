import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getCompany } from "@/lib/api/company";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { formatNumber, initials } from "@/lib/format";
import type { BranchResponse, CompanyResponse } from "@/types";

/**
 * Company detail — the platform owner's view of the registered entity.
 *
 * The route keeps its `[id]` segment, but the id is decorative: this
 * deployment is single-tenant and `GET /company` resolves the company itself,
 * so there is no per-id read to make. The segment is validated and then
 * deliberately not used, rather than being threaded through a call that would
 * ignore it.
 *
 * "Departments" is absent from the metric row: there is no company-wide
 * department count, and producing one would mean fanning out
 * `GET /departments/by-branch/{id}` over every branch on top of the employee
 * fan-out below. Two aggregate tiles that are real beat three where one is a
 * guess. The "+5 this month" hint the placeholder carried is gone for the same
 * reason — nothing records a headcount trend.
 */

const SECTIONS = [
  { id: "branches", label: "Branches" },
] as const;

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-0.5 font-label-rail text-[10px] uppercase text-outline">
        {label}
      </p>
      <p className="font-body-md text-body-md font-medium text-on-surface">
        {value}
      </p>
    </div>
  );
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Read gate — ADMIN has `company:read` but not `company:write`.
  await requirePermission("company:read");

  const { id } = await params;
  const companyId = Number(id);

  if (!Number.isInteger(companyId) || companyId <= 0) notFound();

  let company: CompanyResponse;
  let branches: BranchResponse[];

  try {
    [company, branches] = await Promise.all([getCompany(), getBranches()]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");

    return (
      <DataUnavailable
        title="Company"
        description="Registered entity, statutory identifiers and locations."
        subject="Company details"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  // Real headcount per branch. `allSettled` so a single failing branch
  // degrades to "—" instead of taking the whole page down with it.
  const counts = await Promise.allSettled(
    branches.map((branch) => getEmployeesByBranch(branch.id)),
  );

  const headcount = new Map<number, number | null>(
    branches.map((branch, index) => {
      const result = counts[index];
      return [
        branch.id,
        result && result.status === "fulfilled" ? result.value.length : null,
      ];
    }),
  );

  const totalEmployees = [...headcount.values()]
    .filter((value): value is number => value !== null)
    .reduce((sum, value) => sum + value, 0);

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-col gap-2">
            <span className="flex items-center gap-1 font-body-md text-body-md text-on-surface-variant">
              <Link href="/admin/companies" className="hover:text-primary">
                Companies
              </Link>
              <Icon name="chevron_right" className="text-[16px]" />
              <span className="font-medium text-on-surface">
                {company.name}
              </span>
            </span>
            <span>Company Detail</span>
          </span>
        }
      />

      <div className="mb-gutter flex gap-6 border-b border-surface-container-highest">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="border-b-2 border-primary pb-3 font-table-header text-table-header uppercase text-primary"
          >
            {section.label}
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        {/* ───────────────────────────────── profile card ─────────────────── */}
        <div className="md:col-span-4">
          <BentoCard title={null} className="relative overflow-hidden">
            <div className="mb-6 flex items-center gap-4">
              <span
                aria-hidden
                className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-surface-variant bg-surface-container text-lg font-bold text-on-surface-variant shadow-sm"
              >
                {initials(company.name)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-card-stat text-card-stat text-on-surface">
                  {company.name}
                </h2>
                <span className="mt-1 inline-flex items-center rounded-full bg-secondary-fixed/50 px-2 py-0.5 font-body-md text-[10px] text-on-secondary-fixed">
                  <span className="mr-1.5 size-1.5 rounded-full bg-primary" />
                  Registered
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3">
              <Field label="KRA PIN" value={company.kraPin ?? "—"} />
              <Field label="Currency" value={company.currency ?? "—"} />
              <Field label="SHIF" value={company.shifNumber ?? "—"} />
              <Field label="Timezone" value={company.timezone ?? "—"} />
              <Field label="NSSF" value={company.nssfNumber ?? "—"} />
              <Field label="NITA" value={company.nitaNumber ?? "—"} />
            </div>

            <dl className="mt-6 flex flex-col gap-2 border-t border-surface-container-highest pt-4 font-body-md text-body-md">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Email</dt>
                <dd className="min-w-0 break-all text-right text-on-surface">
                  {company.email ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Phone</dt>
                <dd className="text-right text-on-surface">
                  {company.phone ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Website</dt>
                <dd className="min-w-0 break-all text-right text-on-surface">
                  {company.website ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-on-surface-variant">Address</dt>
                <dd className="text-right text-on-surface">
                  {company.address ?? "—"}
                </dd>
              </div>
            </dl>
          </BentoCard>
        </div>

        {/* ───────────────────────────────── stats + branches ─────────────── */}
        <div className="flex flex-col gap-gutter md:col-span-8">
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2">
            <MetricCard
              label="Branches"
              value={formatNumber(branches.length)}
              icon="store"
              tone="primary"
            />
            <MetricCard
              label="Employees"
              value={formatNumber(totalEmployees)}
              icon="groups"
              tone="tertiary"
            />
          </div>

          <div id="branches">
            <BentoCard
              title="Branches"
              subtitle={`${formatNumber(branches.length)} locations`}
              action={
                <Link
                  href="/admin/branches"
                  className="flex items-center gap-1 font-body-md text-body-md font-medium text-primary-container hover:underline"
                >
                  Branch Directory
                  <Icon name="arrow_forward" className="text-[16px]" />
                </Link>
              }
            >
              {branches.length === 0 ? (
                <EmptyState
                  symbol="location_off"
                  title="No branches yet"
                  description="Locations added to this company will be listed here."
                />
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="data-table w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">
                          Branch Name
                        </th>
                        <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                          Code
                        </th>
                        <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                          Manager
                        </th>
                        <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">
                          Headcount
                        </th>
                        <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-body-md text-body-md">
                      {branches.map((branch) => {
                        const count = headcount.get(branch.id);

                        return (
                          <tr
                            key={branch.id}
                            className="group transition-colors"
                          >
                            <td className="py-4 pl-2 font-medium">
                              <Link
                                href={`/admin/branches/${branch.id}`}
                                className="flex items-center gap-3 group-hover:text-primary-container"
                              >
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {initials(branch.name)}
                                </span>
                                {branch.name}
                              </Link>
                            </td>
                            <td className="py-4 font-mono text-[11px] text-on-surface-variant">
                              {branch.code}
                            </td>
                            <td className="py-4 text-on-surface-variant">
                              {branch.managerName ?? (
                                <span className="text-amber-main">
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-right font-medium tabular-nums">
                              {count === null || count === undefined
                                ? "—"
                                : formatNumber(count)}
                            </td>
                            <td className="py-4 pr-2 text-right">
                              <StatusBadge status={branch.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </BentoCard>
          </div>
        </div>
      </div>
    </>
  );
}
