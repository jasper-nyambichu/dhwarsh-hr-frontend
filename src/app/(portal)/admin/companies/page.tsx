import { requirePermission } from "@/app/lib/dal";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatNumber, initials } from "@/lib/format";
import type { Company } from "@/types";

/**
 * Companies list (multi-company platform administration).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Company`, plus branch/
 * employee counts and a registration number the list view needs as a
 * projection (not on the base Company DTO). Swap for
 * `await api.get<Paginated<CompanySummary>>("/companies")` when ready —
 * that endpoint doesn't exist in the documented API yet either.
 * ─────────────────────────────────────────────────────────────────────────
 */

type CompanyRow = Pick<Company, "id" | "name" | "currency"> & {
  registrationNo: string;
  branches: number;
  employees: number;
  status: "ACTIVE" | "INACTIVE";
};

const COMPANIES: readonly CompanyRow[] = [
  { id: 1, name: "Dhwarsh Logistics", registrationNo: "REG-2023-0891", branches: 12, employees: 450, currency: "KES", status: "ACTIVE" },
  { id: 2, name: "Nairobi Retailers Ltd.", registrationNo: "REG-2021-4452", branches: 34, employees: 1_200, currency: "KES", status: "ACTIVE" },
  { id: 3, name: "Savannah Tech Hub", registrationNo: "REG-2024-0102", branches: 2, employees: 85, currency: "USD", status: "ACTIVE" },
  { id: 4, name: "Mombasa Construction", registrationNo: "REG-2019-8831", branches: 5, employees: 320, currency: "KES", status: "INACTIVE" },
];

export default async function CompaniesPage() {
  await requirePermission("company:write");

  const activeCount = COMPANIES.filter((c) => c.status === "ACTIVE").length;

  return (
    <>
      <PageHeader
        title="Companies"
        description="Manage and oversee all registered organizations within the Dhwarsh platform."
        actions={
          <button
            type="button"
            className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-on-primary-fixed-variant px-6 py-2.5 font-semibold text-on-primary shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-ambient-2"
          >
            <Icon name="add" className="text-[18px]" />
            Add Company
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 md:col-span-3">
          <MetricCard label="Total Companies" value={formatNumber(COMPANIES.length)} icon="business" tone="primary" />
        </div>
        <div className="col-span-12 md:col-span-3">
          <MetricCard label="Active Subscriptions" value={formatNumber(activeCount)} icon="check_circle" tone="primary" />
        </div>

        <div className="col-span-12 mt-2 overflow-hidden rounded-card bg-surface-container-lowest shadow-ambient-1">
          <div className="flex items-center justify-between border-b border-[#E9EFF5] bg-white p-card-padding">
            <h3 className="text-base font-semibold text-on-surface">Registered Organizations</h3>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline" />
              <input
                type="text"
                placeholder="Search companies..."
                className="w-64 rounded-lg border border-[#E9EFF5] py-2 pl-9 pr-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Company</th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Branches</th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Employees</th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Currency</th>
                  <th className="px-6 py-3 font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="px-6 py-3 text-right font-table-header text-table-header uppercase tracking-wider text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EFF5] font-body-md text-on-surface">
                {COMPANIES.map((company) => (
                  <tr key={company.id} className={`group cursor-pointer transition-colors hover:bg-surface/50 ${company.status === "INACTIVE" ? "opacity-70" : ""}`}>
                    <td className="flex items-center gap-3 px-6 py-4">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border border-[#E9EFF5] bg-surface-variant text-on-surface-variant"
                      >
                        {initials(company.name)}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold transition-colors group-hover:text-primary">
                          {company.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-outline">{company.registrationNo}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatNumber(company.branches)}</td>
                    <td className="px-6 py-4">{formatNumber(company.employees)}</td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-surface-container-low px-2 py-1 text-xs font-medium text-on-surface-variant">
                        {company.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {company.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-container">
                          <span className="size-1.5 rounded-full bg-primary-container" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                          <span className="size-1.5 rounded-full bg-outline" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" className="bg-transparent text-xs font-medium text-primary-container transition-all hover:underline">
                        {company.status === "ACTIVE" ? "Manage" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#E9EFF5] bg-white p-4 text-sm text-on-surface-variant">
            <span>Showing 1 to {COMPANIES.length} of 42 entries</span>
            <div className="flex gap-1">
              <button type="button" className="rounded border border-[#E9EFF5] px-3 py-1 transition-colors hover:bg-surface disabled:opacity-50" disabled>
                Prev
              </button>
              <button type="button" className="rounded bg-primary px-3 py-1 font-medium text-white">
                1
              </button>
              <button type="button" className="rounded border border-[#E9EFF5] px-3 py-1 transition-colors hover:bg-surface">
                2
              </button>
              <button type="button" className="rounded border border-[#E9EFF5] px-3 py-1 transition-colors hover:bg-surface">
                3
              </button>
              <span className="px-2 py-1">...</span>
              <button type="button" className="rounded border border-[#E9EFF5] px-3 py-1 transition-colors hover:bg-surface">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}