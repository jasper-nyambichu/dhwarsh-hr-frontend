import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { AssignDepartmentForm } from "@/components/features/staff/assign-department-form";
import { CancelDamageButton } from "@/components/features/staff/cancel-damage-button";
import { deleteStaffAction } from "@/app/actions/staff";
import { MoveEmployeeBranchForm } from "@/components/features/staff/move-employee-branch-form";
import { TerminateEmployeeButton } from "@/components/features/staff/terminate-employee-button";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getBranches } from "@/lib/api/branch";
import { getEmployeeDamages } from "@/lib/api/damage";
import { getDepartments } from "@/lib/api/department";
import { getEmployee } from "@/lib/api/employee";
import { formatMoney, formatDate, humanizeEnum } from "@/lib/format";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 py-2.5 last:border-0">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="text-right text-sm font-medium text-on-surface">{value?.trim() ? value : "—"}</span>
    </div>
  );
}

/** One employee's record, with department assignment and termination. */
export default async function AdminEmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("employee:write");

  const { id } = await params;
  const employeeId = Number(id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) notFound();

  let employee: Awaited<ReturnType<typeof getEmployee>>;
  let departments: Awaited<ReturnType<typeof getDepartments>>;
  let branches: Awaited<ReturnType<typeof getBranches>>;
  let damages: Awaited<ReturnType<typeof getEmployeeDamages>>;
  try {
    [employee, departments, branches, damages] = await Promise.all([getEmployee(employeeId), getDepartments(), getBranches(), getEmployeeDamages(employeeId)]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return <DataUnavailable title="Employee" subject="This employee" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const openDamages = damages.filter((damage) => damage.status === "APPROVED" || damage.status === "PENDING_CONSENT");

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Link href="/admin/employees" aria-label="Back to employees" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </Link>
            {employee.fullName}
            <StatusBadge status={employee.employmentStatus} />
          </span>
        }
        description={`${employee.employeeNumber} · ${employee.branchName ?? "Branch"}`}
      />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <BentoCard title="Details">
            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
              <div>
                <Row label="National ID" value={employee.nationalId} />
                <Row label="Phone" value={employee.phone} />
                <Row label="Email" value={employee.email} />
                <Row label="Gender" value={employee.gender} />
                <Row label="Date of birth" value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : null} />
              </div>
              <div>
                <Row label="Position" value={employee.position} />
                <Row label="Employment type" value={humanizeEnum(employee.employmentType)} />
                <Row label="Basic salary" value={employee.basicSalary === null ? null : formatMoney(employee.basicSalary)} />
                <Row label="Date hired" value={employee.dateHired ? formatDate(employee.dateHired) : null} />
                <Row label="Agent" value={employee.agentName ?? "Paid directly"} />
                <Row label="M-Pesa number" value={employee.bankAccountNumber} />
              </div>
            </div>
          </BentoCard>

          {openDamages.length > 0 ? (
            <BentoCard title="Damages not yet deducted" subtitle="An approved damage blocks deleting this employee until it is deducted in an agent payment or cancelled.">
              <ul className="flex flex-col divide-y divide-outline-variant/20">
                {openDamages.map((damage) => (
                  <li key={damage.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-on-surface">
                        {formatMoney(damage.amount)}
                        <StatusBadge status={damage.status} />
                      </p>
                      <p className="mt-1 break-words text-sm text-on-surface-variant">{damage.description}</p>
                      <p className="mt-0.5 text-xs text-on-surface-variant">{formatDate(damage.damageDate)}</p>
                    </div>
                    <CancelDamageButton id={damage.id} amount={formatMoney(damage.amount)} description={damage.description} />
                  </li>
                ))}
              </ul>
            </BentoCard>
          ) : null}
        </div>

        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <AssignDepartmentForm
            employeeId={employee.id}
            currentDepartmentId={employee.departmentId}
            departments={departments.map((department) => ({ id: department.id, name: department.name }))}
          />
          <MoveEmployeeBranchForm
            employeeId={employee.id}
            currentBranchId={employee.branchId}
            branches={branches.filter((branch) => branch.status === "ACTIVE" || branch.id === employee.branchId).map((branch) => ({ id: branch.id, name: branch.name }))}
          />
          {employee.employmentStatus === "ACTIVE" ? <TerminateEmployeeButton employeeId={employee.id} name={employee.fullName} /> : null}
          <BentoCard title="Delete employee" subtitle="Removes them from every list and closes up the employee codes. Refused while they have unpaid days, an unpaid loan or an approved damage not yet deducted. Their payslips, payments, loans and damages stay on record.">
            <ConfirmDeleteButton
              action={deleteStaffAction}
              id={employee.id}
              name={employee.fullName}
              label="Delete Employee"
              title="Delete this employee?"
              confirmText="They will stop being able to clock in."
            />
          </BentoCard>
        </div>
      </div>
    </>
  );
}