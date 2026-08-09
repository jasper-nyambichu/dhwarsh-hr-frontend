import { requirePermission } from "@/app/lib/dal";
import { BarChart, type BarDatum } from "@/components/shared/bar-chart";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatNumber, initials } from "@/lib/format";
import type { Department, EmployeeSummary } from "@/types";

/**
 * Department detail — employee roster and headcount trend.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Department` and
 * `types.EmployeeSummary`. Swap for
 * `await api.get<Department>(`/departments/${id}`)` and
 * `await api.get<EmployeeSummary[]>("/employees/by-department/{id}")` when
 * ready. The headcount trend has no endpoint yet.
 * ─────────────────────────────────────────────────────────────────────────
 */

const DEPARTMENT: Department & { totalEmployees: number; openRoles: number; onLeave: number } = {
  id: 1,
  name: "Operations Department",
  branchId: 1,
  branchName: "Nairobi CBD",
  headOfDepartmentId: 1,
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
  totalEmployees: 134,
  openRoles: 4,
  onLeave: 8,
};

const HEAD = {
  name: "Robert K. Sterling",
  title: "VP of Operations",
  email: "robert.sterling@dhwarsh.com",
  phone: "+254 712 345 678",
  location: "Nairobi HQ, Floor 4",
};

const HEADCOUNT_TREND: readonly BarDatum[] = [
  { label: "Jan", value: 85, tooltip: "85 employees" },
  { label: "Feb", value: 92, tooltip: "92 employees" },
  { label: "Mar", value: 105, tooltip: "105 employees" },
  { label: "Apr", value: 101, tooltip: "101 employees" },
  { label: "May", value: 120, tooltip: "120 employees" },
  { label: "Jun", value: 134, tooltip: "134 employees" },
];

const ROSTER: readonly (Pick<EmployeeSummary, "id" | "fullName" | "position" | "employmentType"> & {
  employeeCode: string;
  onLeave: boolean;
})[] = [
  { id: 1, fullName: "Sarah Jenkins", employeeCode: "OP-1042", position: "Senior Operations Analyst", employmentType: "PERMANENT", onLeave: false },
  { id: 2, fullName: "Marcus Reed", employeeCode: "OP-1108", position: "Logistics Coordinator", employmentType: "PERMANENT", onLeave: false },
  { id: 3, fullName: "Elena Rostova", employeeCode: "OP-1205", position: "Operations Assistant", employmentType: "CONTRACT", onLeave: true },
  { id: 4, fullName: "David Thorne", employeeCode: "OP-0982", position: "Process Improvement Lead", employmentType: "PERMANENT", onLeave: false },
];

export default async function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("department:write");
  const { id } = await params;
  const department = DEPARTMENT; // TODO: fetch by `id` once the endpoint exists

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <button type="button" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </button>
            {department.name}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-8">
          <BentoCard title="Headcount Trend" subtitle="Growth over the last 6 months" action={<Icon name="more_horiz" className="text-on-surface-variant" />} className="flex min-h-[320px] flex-col">
            <div className="flex flex-1 flex-col rounded-lg bg-surface-container-low/50 p-2">
              <BarChart data={HEADCOUNT_TREND} max={150} axisLabels={["150", "100", "50", "0"]} tone="primary" />
            </div>
          </BentoCard>

          <BentoCard
            title="Department Roster"
            action={
              <div className="flex gap-2">
                <div className="relative">
                  <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    className="w-48 rounded-lg border border-outline-variant/50 bg-surface py-1.5 pl-8 pr-3 font-body-md text-body-md focus:border-primary focus:outline-none"
                  />
                </div>
                <button type="button" className="flex items-center gap-1 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-1.5 font-body-md text-body-md text-on-surface transition-colors hover:bg-surface-container-high">
                  <Icon name="filter_list" className="text-[16px]" />
                  Filter
                </button>
              </div>
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Employee</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Job Title</th>
                    <th className="pb-3 font-table-header text-table-header uppercase text-outline">Type</th>
                    <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md">
                  {ROSTER.map((emp) => (
                    <tr key={emp.id} className="group cursor-pointer transition-colors hover:bg-surface">
                      <td className="py-3 pl-2">
                        <span className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container/20 text-xs font-bold text-primary-container"
                          >
                            {initials(emp.fullName)}
                          </span>
                          <span>
                            <span className="block text-[13px] font-semibold text-on-surface">{emp.fullName}</span>
                            <span className="block text-[11px] text-outline">ID: {emp.employeeCode}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-3 text-[13px] text-on-surface-variant">{emp.position}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-semibold text-on-secondary-container">
                          {emp.employmentType === "PERMANENT" ? "Full-Time" : emp.employmentType === "CONTRACT" ? "Contract" : emp.employmentType}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        {emp.onLeave ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-error-container/50 px-2 py-1 text-[11px] font-medium text-on-error-container">
                            <Icon name="beach_access" className="text-[12px]" />
                            On Leave
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-tertiary-container/10 px-2 py-1 text-[11px] font-medium text-tertiary-container">
                            <span className="size-1.5 rounded-full bg-tertiary-container" />
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-center">
              <button type="button" className="flex items-center gap-1 font-body-md text-sm text-primary hover:underline">
                View All {formatNumber(department.totalEmployees)} Employees
                <Icon name="arrow_forward" className="text-[16px]" />
              </button>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title={null} className="relative overflow-hidden">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-table-header text-table-header uppercase tracking-wider text-outline">Total Employees</h3>
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                <Icon name="groups" className="text-[18px]" />
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-card-stat text-[32px] leading-none text-on-surface">{formatNumber(department.totalEmployees)}</span>
              <span className="flex items-center rounded bg-tertiary-container/10 px-2 py-0.5 text-sm font-semibold text-tertiary-container">
                <Icon name="trending_up" className="text-[14px] font-bold" />
                <span className="ml-1">+12%</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">vs last quarter (120)</p>
          </BentoCard>

          <BentoCard title={null} className="flex flex-col items-center text-center">
            <h3 className="mb-6 w-full text-left font-table-header text-table-header uppercase tracking-wider text-outline">
              Head of Department
            </h3>
            <span
              aria-hidden
              className="mb-4 flex size-24 items-center justify-center rounded-full border-4 border-surface bg-secondary-container text-xl font-bold text-primary shadow-sm"
            >
              {initials(HEAD.name)}
            </span>
            <h4 className="font-card-stat text-lg text-on-surface">{HEAD.name}</h4>
            <p className="mt-1 font-medium text-primary">{HEAD.title}</p>
            <div className="my-5 h-px w-full bg-outline-variant/30" />
            <div className="mb-6 flex w-full flex-col gap-3 text-left">
              <span className="flex items-center gap-3 text-on-surface-variant">
                <Icon name="mail" className="text-[18px] text-outline" />
                <span className="truncate font-body-md text-sm">{HEAD.email}</span>
              </span>
              <span className="flex items-center gap-3 text-on-surface-variant">
                <Icon name="call" className="text-[18px] text-outline" />
                <span className="font-body-md text-sm">{HEAD.phone}</span>
              </span>
              <span className="flex items-center gap-3 text-on-surface-variant">
                <Icon name="location_on" className="text-[18px] text-outline" />
                <span className="font-body-md text-sm">{HEAD.location}</span>
              </span>
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container/10 py-2.5 font-body-md font-semibold text-primary-container transition-colors hover:bg-primary-container/20"
            >
              <Icon name="chat" className="text-[18px]" />
              Send Message
            </button>
          </BentoCard>

          <div className="grid grid-cols-2 gap-4">
            <BentoCard title={null}>
              <h3 className="mb-2 font-table-header text-table-header uppercase tracking-wider text-outline">Open Roles</h3>
              <span className="font-card-stat text-2xl text-on-surface">{department.openRoles}</span>
            </BentoCard>
            <BentoCard title={null}>
              <h3 className="mb-2 font-table-header text-table-header uppercase tracking-wider text-outline">On Leave</h3>
              <span className="font-card-stat text-2xl text-on-surface">{department.onLeave}</span>
            </BentoCard>
          </div>
        </div>
      </div>
    </>
  );
}