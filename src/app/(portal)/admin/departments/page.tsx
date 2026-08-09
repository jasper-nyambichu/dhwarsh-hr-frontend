import { requirePermission } from "@/app/lib/dal";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatNumber, initials } from "@/lib/format";
import type { Department } from "@/types";

/**
 * Departments list.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.Department`, plus code, head
 * name, employee count, and status the list view needs as a projection.
 * Swap for `await api.get<Paginated<DepartmentSummary>>("/departments")`
 * when ready.
 * ─────────────────────────────────────────────────────────────────────────
 */

type DepartmentRow = Department & {
  code: string;
  headName: string | null;
  employeeCount: number;
  status: "ACTIVE" | "INACTIVE";
};

const DEPARTMENTS: readonly DepartmentRow[] = [
  { id: 1, name: "Operations", branchId: 1, branchName: "Nairobi CBD", headOfDepartmentId: 1, code: "OPS", headName: "David Mutua", employeeCount: 142, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 2, name: "Sales & Marketing", branchId: 2, branchName: "Mombasa Hub", headOfDepartmentId: 2, code: "SAL", headName: "Sarah Ochieng", employeeCount: 85, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 3, name: "Human Resources", branchId: 1, branchName: "Nairobi CBD", headOfDepartmentId: 3, code: "HRM", headName: "John Kamau", employeeCount: 12, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 4, name: "Information Technology", branchId: 3, branchName: "Nakuru Branch", headOfDepartmentId: 4, code: "ITD", headName: "Peter Njoroge", employeeCount: 34, status: "INACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 5, name: "Finance & Accounts", branchId: 1, branchName: "Nairobi CBD", headOfDepartmentId: 5, code: "FIN", headName: "Mercy Nduta", employeeCount: 28, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
  { id: 6, name: "Customer Support", branchId: 2, branchName: "Mombasa Hub", headOfDepartmentId: 6, code: "CSD", headName: "Aisha Hassan", employeeCount: 56, status: "ACTIVE", createdAt: null, updatedAt: null, createdBy: null, updatedBy: null },
];

export default async function DepartmentsPage() {
  await requirePermission("department:write");

  return (
    <>
      <PageHeader
        title="Departments"
        description="Manage company divisions and their respective leads."
        actions={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-5 py-2.5 font-bold text-white shadow-sm transition-all hover:bg-primary"
          >
            <Icon name="add" className="text-sm" />
            <span className="text-sm">Add Department</span>
          </button>
        }
      />

      <div className="overflow-hidden rounded-card border border-outline-variant/30 bg-surface-container-lowest shadow-ambient-1">
        <div className="flex items-center justify-between border-b border-outline-variant/30 bg-surface-bright/50 p-card-padding">
          <h3 className="font-bold text-on-surface">Active Departments</h3>
          <div className="flex gap-2">
            <button type="button" className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-primary-container/10 hover:text-primary">
              <Icon name="filter_list" className="text-sm" />
            </button>
            <button type="button" className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-primary-container/10 hover:text-primary">
              <Icon name="download" className="text-sm" />
            </button>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="data-table w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-bright">
                <th className="border-b border-[#E9EFF5] px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Department Name</th>
                <th className="border-b border-[#E9EFF5] px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Code</th>
                <th className="border-b border-[#E9EFF5] px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Branch</th>
                <th className="border-b border-[#E9EFF5] px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Head</th>
                <th className="border-b border-[#E9EFF5] px-6 py-4 text-center font-table-header text-table-header uppercase text-on-surface-variant">Employees</th>
                <th className="border-b border-[#E9EFF5] px-6 py-4 font-table-header text-table-header uppercase text-on-surface-variant">Status</th>
                <th className="border-b border-[#E9EFF5] px-6 py-4 text-right font-table-header text-table-header uppercase text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EFF5] font-body-md text-body-md text-on-surface">
              {DEPARTMENTS.map((dept) => (
                <tr key={dept.id} className="group cursor-pointer transition-colors hover:bg-background/80">
                  <td className="px-6 py-4 font-medium text-primary">{dept.name}</td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-surface-container px-2 py-1 font-mono text-xs text-on-surface-variant">{dept.code}</span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{dept.branchName}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container/20 text-xs font-bold text-primary"
                      >
                        {dept.headName ? initials(dept.headName) : "—"}
                      </span>
                      <span className="font-medium">{dept.headName ?? "Unassigned"}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{formatNumber(dept.employeeCount)}</td>
                  <td className="px-6 py-4">
                    {dept.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-soft px-2.5 py-1 text-[10px] font-bold text-primary-container">
                        <span className="size-1.5 rounded-full bg-primary-container" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-2.5 py-1 text-[10px] font-bold text-on-surface-variant">
                        <span className="size-1.5 rounded-full bg-outline" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" className="p-1 text-on-surface-variant opacity-0 transition-colors hover:text-primary group-hover:opacity-100">
                      <Icon name="more_vert" className="text-[18px]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#E9EFF5] bg-surface-bright px-6 py-4">
          <span className="text-xs text-on-surface-variant">Showing 1 to {DEPARTMENTS.length} of 12 entries</span>
          <div className="flex gap-1">
            <button type="button" disabled className="flex size-8 items-center justify-center rounded border border-[#E9EFF5] text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50">
              <Icon name="chevron_left" className="text-sm" />
            </button>
            <button type="button" className="flex size-8 items-center justify-center rounded bg-primary text-sm font-medium text-white">1</button>
            <button type="button" className="flex size-8 items-center justify-center rounded border border-[#E9EFF5] text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low">2</button>
            <button type="button" className="flex size-8 items-center justify-center rounded border border-[#E9EFF5] text-on-surface-variant transition-colors hover:bg-surface-container-low">
              <Icon name="chevron_right" className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
