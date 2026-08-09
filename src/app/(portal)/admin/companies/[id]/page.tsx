import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatNumber, initials } from "@/lib/format";
import type { Company } from "@/types";

/**
 * Company detail. Tabs: Overview / Branches / Departments / Settings.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Company`, plus branch/
 * department/employee counts the Overview tab needs as a projection.
 * Swap for `await api.get<Company>(`/companies/${id}`)` when the endpoint
 * exists. Only the Overview tab renders real content; Branches,
 * Departments, and Settings tabs are not yet wired.
 * ─────────────────────────────────────────────────────────────────────────
 */

const COMPANY: Company & { branchCount: number; employeeCount: number; departmentCount: number } = {
  id: 1,
  name: "Dhwarsh Logistics",
  logoUrl: null,
  address: null,
  phone: null,
  email: null,
  website: null,
  kraPin: "P051234567W",
  shifNumber: "998877",
  nssfNumber: "112233",
  nitaNumber: null,
  currency: "KES",
  timezone: "EAT (UTC+3)",
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
  branchCount: 12,
  employeeCount: 450,
  departmentCount: 8,
};

const TABS = ["Overview", "Branches", "Departments", "Settings"] as const;

const TOP_BRANCHES = [
  { id: 1, name: "Nairobi Central", initials: "HQ", tone: "text-primary bg-primary/10", location: "Westlands, Nairobi", headcount: 185 },
  { id: 2, name: "Mombasa Hub", initials: "MS", tone: "text-secondary bg-secondary/10", location: "Kilindini, Mombasa", headcount: 120 },
  { id: 3, name: "Nakuru Depot", initials: "NK", tone: "text-error bg-error/10", location: "Industrial Area, Nakuru", headcount: 65 },
] as const;

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("company:write");
  const { id } = await params;
  const company = COMPANY; // TODO: fetch by `id` once the endpoint exists

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
              <span className="font-medium text-on-surface">{company.name}</span>
            </span>
            <span>Company Detail</span>
          </span>
        }
      />

      <div className="mb-gutter flex gap-6 border-b border-surface-container-highest">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={
              i === 0
                ? "border-b-2 border-primary pb-3 font-table-header text-table-header uppercase text-primary"
                : "border-b-2 border-transparent pb-3 font-table-header text-table-header uppercase text-on-surface-variant transition-colors hover:text-on-surface"
            }
          >
            {tab}
          </button>
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
              <div>
                <h2 className="font-card-stat text-card-stat text-on-surface">{company.name}</h2>
                <span className="mt-1 inline-flex items-center rounded-full bg-secondary-fixed/50 px-2 py-0.5 font-body-md text-[10px] text-on-secondary-fixed">
                  <span className="mr-1.5 size-1.5 rounded-full bg-primary" />
                  Active
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-3">
              <Field label="KRA PIN" value={company.kraPin ?? "—"} />
              <Field label="Currency" value={company.currency ?? "—"} />
              <Field label="SHIF" value={company.shifNumber ?? "—"} />
              <Field label="Timezone" value={company.timezone ?? "—"} />
              <Field label="NSSF" value={company.nssfNumber ?? "—"} span2 />
            </div>
            <div className="mt-6 border-t border-surface-container-highest pt-4">
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-lg bg-blue-soft py-2 font-body-md text-body-md font-medium text-primary-container transition-colors hover:bg-secondary-container"
              >
                <Icon name="edit_document" className="mr-2 text-[18px]" />
                Edit Details
              </button>
            </div>
          </BentoCard>
        </div>

        {/* ───────────────────────────────── stats + branches ─────────────────── */}
        <div className="flex flex-col gap-gutter md:col-span-8">
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-3">
            <MetricCard label="Total Branches" value={formatNumber(company.branchCount)} icon="store" tone="primary" />
            <MetricCard label="Active Employees" value={formatNumber(company.employeeCount)} icon="groups" tone="tertiary" hint="+5 this month" />
            <MetricCard label="Departments" value={formatNumber(company.departmentCount)} icon="account_tree" tone="primary" />
          </div>

          <BentoCard
            title="Most Active Branches"
            action={
              <Link href="/admin/branches" className="flex items-center gap-1 font-body-md text-body-md font-medium text-primary-container hover:underline">
                View All Branches
                <Icon name="arrow_forward" className="text-[16px]" />
              </Link>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Branch Name</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Location</th>
                    <th className="pb-3 text-right font-table-header text-table-header uppercase text-outline">Headcount</th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {TOP_BRANCHES.map((branch) => (
                    <tr key={branch.id} className="group transition-colors">
                      <td className="py-4 pl-2 font-medium">
                        <Link href={`/admin/branches/${branch.id}`} className="flex items-center gap-3 group-hover:text-primary-container">
                          <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${branch.tone}`}>
                            {branch.initials}
                          </span>
                          {branch.name}
                        </Link>
                      </td>
                      <td className="py-4 text-on-surface-variant">{branch.location}</td>
                      <td className="py-4 text-right font-medium tabular-nums">{formatNumber(branch.headcount)}</td>
                      <td className="py-4 pr-2 text-right">
                        <span className="rounded bg-tertiary-fixed/30 px-2 py-0.5 text-[10px] font-medium text-tertiary">
                          Operational
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, span2 }: { label: string; value: string; span2?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : undefined}>
      <p className="mb-0.5 font-label-rail text-[10px] uppercase text-outline">{label}</p>
      <p className="font-body-md text-body-md font-medium text-on-surface">{value}</p>
    </div>
  );
}