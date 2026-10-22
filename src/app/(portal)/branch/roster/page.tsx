import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getMyBranch } from "@/lib/api/branch";
import { getDepartments } from "@/lib/api/department";
import { getEmployeesByBranch } from "@/lib/api/employee";
import { getShiftAssignmentsForBranch, getShifts } from "@/lib/api/shift";
import { humanizeEnum } from "@/lib/format";

import { AssignShiftForm } from "./_components/assign-shift-form";

function hhmm(value: string | null): string {
  return value ? value.slice(0, 5) : "—";
}

/** The branch's shifts and who is on which one — and assigning a shift to one employee or the whole branch. */
export default async function BranchRosterPage() {
  await requirePermission("shift:read:branch");

  let data: {
    branch: Awaited<ReturnType<typeof getMyBranch>>;
    shifts: Awaited<ReturnType<typeof getShifts>>;
    assignments: Awaited<ReturnType<typeof getShiftAssignmentsForBranch>>;
    employees: Awaited<ReturnType<typeof getEmployeesByBranch>>;
    departments: Awaited<ReturnType<typeof getDepartments>>;
  };
  try {
    const branch = await getMyBranch();
    const [shifts, assignments, employees, departments] = await Promise.all([
      getShifts(),
      getShiftAssignmentsForBranch(branch.id),
      getEmployeesByBranch(branch.id),
      getDepartments(),
    ]);
    data = { branch, shifts, assignments, employees, departments };
  } catch (error) {
    return (
      <DataUnavailable
        title="Roster"
        subject="Your roster"
        reason={error instanceof ApiError ? error.message : "Your account may not be assigned to a branch yet — ask an Admin."}
      />
    );
  }

  const employeeNames = new Map(data.employees.map((person) => [person.id, person.fullName]));
  const departmentNames = new Map(data.departments.map((department) => [department.id, department.name]));

  const target = (assignment: (typeof data.assignments)[number]): string => {
    if (assignment.employeeId) return employeeNames.get(assignment.employeeId) ?? `Employee #${assignment.employeeId}`;
    if (assignment.departmentId) return `${departmentNames.get(assignment.departmentId) ?? "Department"} (all branches)`;
    return `Whole branch — ${data.branch.name}`;
  };

  return (
    <>
      <PageHeader title="Roster" description={`Shifts for ${data.branch.name}.`} />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard title="Who is on which shift">
            {data.assignments.length === 0 ? (
              <EmptyState symbol="calendar_month" title="No shifts assigned yet" description="Assign a shift to an employee or the whole branch." />
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="data-table w-full min-w-[420px] border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">For</th>
                      <th className="pb-3 pr-2 font-table-header text-table-header uppercase text-outline">Shift</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md text-on-surface">
                    {data.assignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b border-outline-variant/20 last:border-0">
                        <td className="py-3 pl-2 font-semibold">{target(assignment)}</td>
                        <td className="py-3 pr-2 text-on-surface-variant">{assignment.shiftName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>

          <BentoCard title="Shifts" subtitle="Defined by the Admin">
            {data.shifts.length === 0 ? (
              <p className="py-2 text-sm text-on-surface-variant">No shifts defined yet.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="data-table w-full min-w-[420px] border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 pl-2 font-table-header text-table-header uppercase text-outline">Name</th>
                      <th className="pb-3 font-table-header text-table-header uppercase text-outline">Type</th>
                      <th className="pb-3 pr-2 text-right font-table-header text-table-header uppercase text-outline">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-body-md text-on-surface">
                    {data.shifts.map((shift) => (
                      <tr key={shift.id} className="border-b border-outline-variant/20 last:border-0">
                        <td className="py-3 pl-2 font-semibold">{shift.name}</td>
                        <td className="py-3 text-on-surface-variant">{humanizeEnum(shift.type)}</td>
                        <td className="py-3 pr-2 text-right tabular-nums text-on-surface-variant">{hhmm(shift.startTime)} – {hhmm(shift.endTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </BentoCard>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <AssignShiftForm
            shifts={data.shifts.map((shift) => ({ id: shift.id, label: `${shift.name} (${hhmm(shift.startTime)}–${hhmm(shift.endTime)})` }))}
            employees={data.employees
              .filter((person) => person.employmentStatus === "ACTIVE")
              .map((person) => ({ id: person.id, name: `${person.fullName} (${person.employeeNumber})` }))}
          />
        </div>
      </div>
    </>
  );
}