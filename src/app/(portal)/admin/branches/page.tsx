//src/app/%28portal%29/admin/branches/page.tsx
import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { FilterTabs, type FilterTab } from "@/components/shared/filter-tabs";
import { CountPill, PageHeader } from "@/components/shared/page-header";
import { SegmentStrip } from "@/components/shared/segment-strip";
import { Icon } from "@/components/ui/icon";
import { formatMoneyCompact, formatNumber, formatPercent } from "@/lib/format";

/**
 * Branch directory. SUPER_ADMIN and ADMIN both hold `branch:write`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — see the note on the admin dashboard. Rows are shaped
 * against `types.Branch` plus the aggregate columns the list view needs
 * (headcount, attendance, payroll), which the backend will have to supply as
 * a projection rather than the bare entity.
 * ─────────────────────────────────────────────────────────────────────────
 */

type BranchRow = {
  id: number;
  name: string;
  code: string;
  region: string;
  manager: string | null;
  employees: number;
  attendance: number;
  payroll: number;
  status: "ACTIVE" | "INACTIVE";
};

const BRANCHES: readonly BranchRow[] = [
  { id: 1, name: "Nairobi CBD", code: "NBO-01", region: "Nairobi", manager: "Peter Njuguna", employees: 320, attendance: 94, payroll: 4_200_000, status: "ACTIVE" },
  { id: 2, name: "Mombasa Port", code: "MSA-01", region: "Coast", manager: "Ali Hassan", employees: 215, attendance: 88, payroll: 3_100_000, status: "ACTIVE" },
  { id: 3, name: "Kisumu Industrial", code: "KSM-01", region: "Nyanza", manager: "Jane Otieno", employees: 180, attendance: 76, payroll: 2_400_000, status: "ACTIVE" },
  { id: 4, name: "Nakuru Branch", code: "NKR-01", region: "Rift Valley", manager: "David Kimani", employees: 142, attendance: 91, payroll: 1_800_000, status: "ACTIVE" },
  { id: 5, name: "Thika Road", code: "NBO-02", region: "Nairobi", manager: "Grace Wambui", employees: 128, attendance: 89, payroll: 1_600_000, status: "ACTIVE" },
  { id: 6, name: "Eldoret Depot", code: "ELD-01", region: "Rift Valley", manager: null, employees: 96, attendance: 82, payroll: 1_150_000, status: "ACTIVE" },
];

const REGION_TABS: readonly FilterTab[] = [
  { label: "All Regions" },
  { label: "Nairobi", value: "Nairobi" },
  { label: "Coast", value: "Coast" },
  { label: "Rift Valley", value: "Rift Valley" },
  { label: "Nyanza", value: "Nyanza" },
];

/** Below this, an attendance rate reads as a problem rather than a number. */
const ATTENDANCE_WARNING_THRESHOLD = 85;

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  await requirePermission("branch:read");

  // searchParams is a Promise in Next.js 16 — it must be awaited.
  const { region } = await searchParams;

  const rows = region
    ? BRANCHES.filter((branch) => branch.region === region)
    : BRANCHES;

  const active = BRANCHES.filter((b) => b.status === "ACTIVE").length;
  const totalEmployees = rows.reduce((sum, b) => sum + b.employees, 0);
  const unmanaged = rows.filter((b) => b.manager === null).length;

  return (
    <>
      <PageHeader
        title="Branches"
        description="Manage organization locations and regional performance."
        pill={<CountPill label={`${active} Active`} />}
        actions={
          <Link
            href="/admin/branches/new"
            className="bento-shadow flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-body-md text-body-md font-bold text-on-primary transition-colors hover:bg-on-primary-fixed-variant"
          >
            <Icon name="add" className="text-[18px]" />
            Add Branch
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        {/* ─────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <div className="bento-shadow flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface-container-lowest p-3">
            <FilterTabs
              tabs={REGION_TABS}
              active={region}
              param="region"
              basePath="/admin/branches"
            />

            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-outline-variant/40 px-3 py-1.5 font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              <Icon name="swap_vert" className="text-sm" />
              Sort
            </button>
          </div>

          <BentoCard
            title={region ? `${region} branches` : "All branches"}
            subtitle={`${formatNumber(rows.length)} shown · ${formatNumber(totalEmployees)} employees`}
          >
            {rows.length === 0 ? (
              <p className="py-10 text-center font-body-md text-body-md text-outline">
                No branches in this region yet.
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="data-table w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">
                        Branch
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Region
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Manager
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Employees
                      </th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">
                        Attendance&nbsp;%
                      </th>
                      <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">
                        Payroll KES
                      </th>
                    </tr>
                  </thead>

                  <tbody className="font-body-md text-body-md">
                    {rows.map((branch) => {
                      const healthy =
                        branch.attendance >= ATTENDANCE_WARNING_THRESHOLD;

                      return (
                        <tr key={branch.id} className="group transition-colors">
                          <td className="py-3 pl-2">
                            <Link
                              href={`/admin/branches/${branch.id}`}
                              className="flex items-center gap-2"
                            >
                              <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary-container/10 text-primary-container">
                                <Icon name="location_city" className="text-sm" />
                              </span>
                              <span className="min-w-0">
                                <span className="block font-medium text-on-surface group-hover:text-primary-container">
                                  {branch.name}
                                </span>
                                <span className="block text-[10px] text-outline">
                                  {branch.code}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="py-3 text-on-surface-variant">
                            {branch.region}
                          </td>
                          <td className="py-3 text-on-surface-variant">
                            {branch.manager ?? (
                              <span className="text-amber-main">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 tabular-nums text-on-surface-variant">
                            {formatNumber(branch.employees)}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  healthy
                                    ? "font-medium text-tertiary-container"
                                    : "font-medium text-amber-main"
                                }
                              >
                                {formatPercent(branch.attendance)}
                              </span>
                              <span className="hidden h-1 w-12 overflow-hidden rounded-full bg-surface-container sm:block">
                                <span
                                  className="block h-full"
                                  style={{
                                    width: `${branch.attendance}%`,
                                    backgroundColor: healthy
                                      ? "var(--color-green-main)"
                                      : "var(--color-amber-main)",
                                  }}
                                />
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-2 text-right font-medium tabular-nums text-on-surface">
                            {formatMoneyCompact(branch.payroll, {
                              showCurrency: false,
                            })}
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

        {/* ────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <SegmentStrip
            segments={[
              { label: "Branches", value: formatNumber(rows.length) },
              { label: "Employees", value: formatNumber(totalEmployees) },
              {
                label: "Unassigned",
                value: formatNumber(unmanaged),
                tone: unmanaged > 0 ? "warning" : "default",
              },
            ]}
          />

          <BentoCard title="Headcount by region">
            <DonutChart
              segments={[
                { label: "Nairobi", value: 448, color: "var(--color-blue)" },
                { label: "Coast", value: 215, color: "var(--color-green-main)" },
                { label: "Rift Valley", value: 238, color: "var(--color-amber-main)" },
                { label: "Nyanza", value: 180, color: "var(--color-chart-track)" },
              ]}
            />
          </BentoCard>

          <BentoCard
            title="Needs attention"
            subtitle="Branches below the attendance threshold"
          >
            <ul className="flex flex-col gap-3">
              {BRANCHES.filter(
                (b) => b.attendance < ATTENDANCE_WARNING_THRESHOLD,
              ).map((branch) => (
                <li key={branch.id}>
                  <Link
                    href={`/admin/branches/${branch.id}`}
                    className="group -mx-2 flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-surface-container"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold text-on-surface group-hover:text-primary-container">
                        {branch.name}
                      </span>
                      <span className="block text-[10px] text-on-surface-variant">
                        {branch.manager ?? "No manager assigned"}
                      </span>
                    </span>
                    <span className="shrink-0 rounded bg-amber-main/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-main">
                      {formatPercent(branch.attendance)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </BentoCard>
        </div>
      </div>
    </>
  );
}
