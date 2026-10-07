import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { getEmployee } from "@/lib/api/employee";
import { formatDate, formatMoney, initials } from "@/lib/format";
import type { EmployeeResponse } from "@/types";

import { TerminateEmployee } from "../_components/terminate-employee";

/**
 * One employee's full record.
 *
 * This is the only employee read that returns salary and statutory identifiers
 * — every `by-*` list returns the thin `EmployeeSummaryResponse` instead. Their
 * absence from the lists is deliberate on the backend's side, not an oversight
 * here.
 */
export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("employee:read");

  const { id } = await params;
  const employeeId = Number(id);

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    notFound();
  }

  let employee: EmployeeResponse;

  try {
    employee = await getEmployee(employeeId);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isNotFound) notFound();
      if (error.isUnauthorized) throw error;
    }

    return (
      <DataUnavailable
        title="Employee"
        subject="This employee's record"
        reason={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const isTerminated = employee.employmentStatus === "TERMINATED";

  return (
    <>
      <PageHeader
        title={employee.fullName}
        description={`${employee.employeeNumber} · ${employee.branchName ?? "No branch"}`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/hr/employees/${employee.id}/documents`}
              className={buttonVariants({ variant: "secondary" })}
            >
              <Icon name="folder_open" className="text-[18px]" />
              Documents
            </Link>
            <Link
              href={`/hr/employees/${employee.id}/edit`}
              className={buttonVariants()}
            >
              <Icon name="edit" className="text-[18px]" />
              Edit
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="person" className="text-[20px] text-primary" />
                Personal Details
              </span>
            }
          >
            <dl className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <Field label="National ID" value={employee.nationalId} />
              <Field label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
              <Field label="Gender" value={employee.gender} />
              <Field label="Marital Status" value={employee.maritalStatus} />
              <Field label="Phone" value={employee.phone} />
              <Field label="Email" value={employee.email} />
              <Field label="Address" value={employee.address} />
            </dl>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="work" className="text-[20px] text-primary" />
                Employment
              </span>
            }
          >
            <dl className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <Field label="Branch" value={employee.branchName} />
              <Field label="Department" value={employee.departmentName} />
              <Field label="Agent" value={employee.agentName} />
              <Field label="Job Title" value={employee.position} />
              <Field label="Employment Type" value={employee.employmentType} />
              <Field
                label="Date Hired"
                value={formatDate(employee.dateHired)}
              />
            </dl>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="payments" className="text-[20px] text-primary" />
                Compensation
              </span>
            }
          >
            <dl className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <Field label="Basic Salary" value={formatMoney(employee.basicSalary)} />
              <Field label="Bank" value={employee.bankName} />
              <Field label="Account Number" value={employee.bankAccountNumber} />
            </dl>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="assured_workload" className="text-[20px] text-primary" />
                Statutory Details
              </span>
            }
          >
            <dl className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <Field label="KRA PIN" value={employee.kraPin} mono />
              <Field label="NSSF Number" value={employee.nssfNumber} mono />
              <Field label="SHIF Number" value={employee.shifNumber} mono />
              <Field label="NITA Number" value={employee.nitaNumber} mono />
            </dl>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="emergency" className="text-[20px] text-primary" />
                Emergency Contact
              </span>
            }
          >
            <dl className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <Field
                label="Contact Name"
                value={employee.emergencyContactName}
              />
              <Field
                label="Contact Phone"
                value={employee.emergencyContactPhone}
              />
            </dl>
          </BentoCard>
        </div>

        <div className="flex flex-col gap-gutter lg:col-span-4">
          <BentoCard className="text-center">
            <span
              aria-hidden
              className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border-4 border-white bg-primary-container/20 text-2xl font-bold text-primary-container shadow-md"
            >
              {initials(employee.fullName)}
            </span>
            <h3 className="text-lg font-bold text-on-surface">
              {employee.fullName}
            </h3>
            <p className="mb-1 font-body-md text-body-md font-medium text-secondary">
              {employee.position ?? "No job title"}
            </p>
            <p className="mb-4 flex items-center justify-center gap-1 text-[11px] text-on-surface-variant">
              <Icon name="location_on" className="text-[14px]" />
              {employee.branchName ?? "No branch"}
            </p>
            <StatusBadge status={employee.employmentStatus} />
          </BentoCard>

          <BentoCard title="Employee Number">
            <p className="font-mono text-[15px] font-semibold text-on-surface">
              {employee.employeeNumber}
            </p>
            <p className="mt-1 text-[11px] text-outline">
              Generated by the server at creation and not editable — the update
              request has no field for it.
            </p>
          </BentoCard>

          {isTerminated ? (
            <BentoCard title="Terminated">
              <p className="font-body-md text-body-md text-on-surface-variant">
                This employee has been terminated. The API has no endpoint that
                reverses it, so the record stays in this state.
              </p>
            </BentoCard>
          ) : (
            <TerminateEmployee
              employeeId={employee.id}
              employeeName={employee.fullName}
            />
          )}
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-table-header text-table-header uppercase text-outline">
        {label}
      </dt>
      <dd
        className={`mt-1 text-on-surface ${mono ? "font-mono text-[12px]" : "font-body-md text-body-md"}`}
      >
        {value ? value : <span className="text-outline">—</span>}
      </dd>
    </div>
  );
}
