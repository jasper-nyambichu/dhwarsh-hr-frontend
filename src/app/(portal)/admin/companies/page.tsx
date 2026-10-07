import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getCompany } from "@/lib/api/company";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { formatNumber, initials } from "@/lib/format";
import type { BranchResponse, CompanyResponse, EmployeeSummaryResponse } from "@/types";

/**
 * Registered organization — singular, deliberately.
 *
 * The placeholder showed four fictional companies and a pager reading "of 42
 * entries". Neither is possible: `GET /company` is a singleton. This deployment
 * is single-tenant and the backend resolves the company itself, so there is no
 * company collection to list, page, or search. What renders instead is the one
 * registered entity with its real branch and employee counts.
 *
 * If the product is ever meant to administer several companies, that starts on
 * the backend with a company collection endpoint — and this page becomes a list
 * again at that point. Faking the list in the meantime would hide the gap.
 *
 * "Add Company" is gone with it: creating a tenant is not something this API
 * offers.
 */

export default async function CompaniesPage() {
  // Read gate, not a write gate. ADMIN holds `company:read` but not
  // `company:write` (SUPER_ADMIN-only), so gating the list on the write
  // permission bounced ADMIN off a screen whose brief puts it in their rail.
  await requirePermission("company:read");

  let company: CompanyResponse;
  let branches: BranchResponse[];

  try {
    [company, branches] = await Promise.all([getCompany(), getBranches()]);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login");

    return (
      <DataUnavailable
        title="Companies"
        description="The registered organization on this platform."
        subject="The company record"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  // Real headcount. `allSettled` so one unreachable branch degrades to "—"
  // rather than blanking the page.
  const counts = await Promise.allSettled(
    branches.map((branch) => getEmployeesByBranch(branch.id)),
  );

  const totalEmployees = counts
    .filter(
      (result): result is PromiseFulfilledResult<EmployeeSummaryResponse[]> =>
        result.status === "fulfilled",
    )
    .reduce((sum, result) => sum + result.value.length, 0);

  return (
    <>
      <PageHeader
        title="Companies"
        description="The registered organization on this platform."
      />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 md:col-span-4">
          <MetricCard
            label="Registered Organizations"
            value={formatNumber(1)}
            icon="business"
            tone="primary"
            hint="Single-tenant deployment"
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <MetricCard
            label="Branches"
            value={formatNumber(branches.length)}
            icon="store"
            tone="tertiary"
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <MetricCard
            label="Employees"
            value={formatNumber(totalEmployees)}
            icon="groups"
            tone="primary"
          />
        </div>

        <div className="col-span-12 mt-2 overflow-hidden rounded-card bg-surface-container-lowest shadow-ambient-1">
          <div className="flex items-center justify-between border-b border-[#E9EFF5] bg-white p-card-padding">
            <h3 className="text-base font-semibold text-on-surface">
              Registered Organization
            </h3>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                    Company
                  </th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                    Branches
                  </th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                    Employees
                  </th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EFF5] font-body-md text-on-surface">
                <tr className="transition-colors hover:bg-surface/50">
                  <td className="px-6 py-4">
                    {/* Flex on a wrapper, not the <td> — a flex cell drops out
                        of the table layout and desyncs from its header. */}
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border border-[#E9EFF5] bg-surface-variant text-on-surface-variant"
                      >
                        {initials(company.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {company.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-outline">
                          {company.kraPin
                            ? `KRA PIN: ${company.kraPin}`
                            : "No KRA PIN on file"}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {formatNumber(branches.length)}
                  </td>
                  <td className="px-6 py-4">
                    {formatNumber(totalEmployees)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-surface-container-low px-2 py-1 text-xs font-medium text-on-surface-variant">
                      {company.currency ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-container hover:underline"
                    >
                      View
                      <Icon name="arrow_forward" className="text-[14px]" />
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#E9EFF5] bg-white p-4 text-sm text-on-surface-variant">
            One registered organization. This deployment is single-tenant, so
            there is no second page.
          </div>
        </div>
      </div>
    </>
  );
}
