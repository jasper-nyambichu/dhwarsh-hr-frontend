import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DonutChart } from "@/components/shared/charts";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatNumber, initials } from "@/lib/format";
import type { EmployeeSummary, EmploymentStatus } from "@/types";

/**
 * My Team — branch-scoped employee list (this branch manager's own branch).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.EmployeeSummary`. Swap for
 * `await api.get<EmployeeSummary[]>("/employees/by-branch/{id}")`, scoped
 * server-side to the caller's own branch via AccessGuard, when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

type TeamRow = Pick<EmployeeSummary, "id" | "fullName" | "employeeNumber" | "departmentName" | "position" | "employmentStatus"> & {
  employmentTypeLabel: string;
};

const TEAM: readonly TeamRow[] = [
  { id: 1, fullName: "Sarah Jenkins", employeeNumber: "EMP-042", departmentName: "Finance", position: "Accountant", employmentTypeLabel: "Full-time", employmentStatus: "ACTIVE" },
  { id: 2, fullName: "David Kiprono", employeeNumber: "EMP-055", departmentName: "Operations", position: "Logistics Manager", employmentTypeLabel: "Full-time", employmentStatus: "ACTIVE" },
  { id: 3, fullName: "Mercy Njeri", employeeNumber: "EMP-089", departmentName: "Sales", position: "Sales Rep", employmentTypeLabel: "Contract", employmentStatus: "ON_LEAVE" },
  { id: 4, fullName: "Faith Wanjiru", employeeNumber: "EMP-102", departmentName: "HR", position: "HR Assistant", employmentTypeLabel: "Full-time", employmentStatus: "PROBATION" },
  { id: 5, fullName: "Peter Otieno", employeeNumber: "EMP-115", departmentName: "Finance", position: "Financial Analyst", employmentTypeLabel: "Full-time", employmentStatus: "ACTIVE" },
  { id: 6, fullName: "Alice Mwangi", employeeNumber: "EMP-121", departmentName: "Operations", position: "Dispatcher", employmentTypeLabel: "Shift", employmentStatus: "ACTIVE" },
  { id: 7, fullName: "John Kamau", employeeNumber: "EMP-134", departmentName: "Sales", position: "Account Exec", employmentTypeLabel: "Full-time", employmentStatus: "ACTIVE" },
  { id: 8, fullName: "Samuel Ochieng", employeeNumber: "EMP-150", departmentName: "Finance", position: "Senior Auditor", employmentTypeLabel: "Full-time", employmentStatus: "ACTIVE" },
];

const STATUS_CHIP: Record<EmploymentStatus, string> = {
  ACTIVE: "bg-tertiary-container/10 text-tertiary-container",
  PROBATION: "bg-surface-tint/10 text-surface-tint",
  ON_LEAVE: "bg-error/10 text-error",
  SUSPENDED: "bg-error/10 text-error",
  TERMINATED: "bg-outline/10 text-outline",
};

const STATUS_LABEL: Record<EmploymentStatus, string> = {
  ACTIVE: "Active",
  PROBATION: "Probation",
  ON_LEAVE: "On Leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
};

const DEPARTMENT_SPLIT = [
  { label: "Finance", value: 40, color: "var(--color-primary-container)" },
  { label: "Operations", value: 30, color: "var(--color-tertiary-container)" },
  { label: "Sales", value: 20, color: "var(--color-secondary-container)" },
  { label: "HR", value: 10, color: "var(--color-surface-tint)" },
] as const;

export default async function BranchTeamPage() {
  await requirePermission("employee:read");

  const activeCount = TEAM.filter((e) => e.employmentStatus === "ACTIVE").length;
  const probationCount = TEAM.filter((e) => e.employmentStatus === "PROBATION").length;
  const onLeaveCount = TEAM.filter((e) => e.employmentStatus === "ON_LEAVE").length;

  return (
    <>
      <PageHeader
        title="My Team"
        description="Managing personnel for Nairobi CBD branch."
        actions={
          <button type="button" className="flex w-fit items-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-bold text-on-primary transition-opacity hover:opacity-90">
            <Icon name="person_add" className="text-sm" />
            Add Employee
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          <BentoCard
            title="Team Directory"
            action={
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="w-48 rounded-full border border-surface-variant bg-surface py-1.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-primary-container focus:ring-1 focus:ring-primary-container sm:w-64"
                />
              </div>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-on-surface-variant">Employee</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Department</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Job Title</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-on-surface-variant">Type</th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {TEAM.map((emp) => (
                    <tr key={emp.id} className="group cursor-pointer border-b border-surface-variant transition-colors last:border-0 hover:bg-background">
                      <td className="py-4 pl-2">
                        <span className="flex items-center gap-3">
                          <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-primary-container">
                            {initials(emp.fullName)}
                          </span>
                          <span>
                            <span className="block font-semibold text-on-surface transition-colors group-hover:text-primary">{emp.fullName}</span>
                            <span className="block text-[10px] text-on-surface-variant">{emp.employeeNumber}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-4 text-on-surface">{emp.departmentName}</td>
                      <td className="py-4 text-on-surface-variant">{emp.position}</td>
                      <td className="py-4 text-on-surface-variant">{emp.employmentTypeLabel}</td>
                      <td className="py-4 pr-2 text-right">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[emp.employmentStatus]}`}>
                          {STATUS_LABEL[emp.employmentStatus]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-surface-variant p-4 text-on-surface-variant">
              <span className="text-sm">Showing {TEAM.length} of 42 employees</span>
              <div className="flex gap-2">
                <button type="button" className="rounded p-1 transition-colors hover:bg-surface-container-high">
                  <Icon name="chevron_left" className="text-sm" />
                </button>
                <button type="button" className="rounded p-1 transition-colors hover:bg-surface-container-high">
                  <Icon name="chevron_right" className="text-sm" />
                </button>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <BentoCard title="Workforce Status">
            <div className="flex flex-col gap-3">
              <StatusRow label="Active" hint="Currently working" value={activeCount} tone="tertiary-container" />
              <StatusRow label="Probation" hint="Under review" value={probationCount} tone="surface-tint" />
              <StatusRow label="On Leave" hint="Away" value={onLeaveCount} tone="error" />
            </div>
          </BentoCard>

          <BentoCard title="Department Split" subtitle="Distribution across Nairobi CBD">
            <DonutChart segments={DEPARTMENT_SPLIT} size={180} legend="value" centerLabel="Total" />
          </BentoCard>
        </div>
      </div>
    </>
  );
}

function StatusRow({
  label,
  hint,
  value,
  tone,
}: {
  label: string;
  hint: string;
  value: number;
  tone: "tertiary-container" | "surface-tint" | "error";
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg border border-${tone}/10 bg-${tone}/5 p-3`}>
      <span className="flex items-center gap-3">
        <span className={`h-8 w-2 rounded-full bg-${tone}`} />
        <span>
          <span className="block font-semibold text-on-surface">{label}</span>
          <span className="block text-[10px] text-on-surface-variant">{hint}</span>
        </span>
      </span>
      <span className={`font-card-stat text-card-stat text-${tone}`}>{formatNumber(value)}</span>
    </div>
  );
}