import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { EmployeeInfoCards, EmployeeProfileBanner } from "@/components/features/employee/employee-profile";
import { BentoCard } from "@/components/shared/bento-card";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { getEmployee } from "@/lib/api/employee";

const ACTION =
  "flex min-h-11 w-full items-center gap-3 rounded-lg border border-outline-variant/60 px-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/**
 * One employee's record in the Accounts Office, laid out like the Admin's employee page (profile banner and detail
 * cards on the left, actions on the right) without the attendance record. Edit opens the same form as the Admin.
 */
export default async function AccountsEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requirePermission("employee:read");

  const employeeId = Number((await params).employeeId);
  if (!Number.isInteger(employeeId) || employeeId <= 0) notFound();

  let employee: Awaited<ReturnType<typeof getEmployee>>;
  try {
    employee = await getEmployee(employeeId);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    return <DataUnavailable title="Employee" subject="This employee" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  const branchHref = employee.branchId ? `/accounts/employees/branches/${employee.branchId}` : "/accounts/employees";
  const editHref = `/accounts/employees/${employee.id}/edit`;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Link href={branchHref} aria-label="Back to the branch" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="arrow_back_ios_new" />
            </Link>
            <span className="min-w-0 break-words">{employee.fullName}</span>
            <StatusBadge status={employee.employmentStatus} />
          </span>
        }
        description={`${employee.employeeNumber} · ${employee.branchName ?? "Branch"}`}
        actions={
          <Link
            href={editHref}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container"
          >
            <Icon name="edit" className="text-[18px]" />
            Edit details
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 flex min-w-0 flex-col gap-gutter lg:col-span-8">
          <EmployeeProfileBanner employee={employee} />
          <EmployeeInfoCards
            employee={employee}
            action={
              <Link href={editHref} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                <Icon name="edit" className="text-[16px]" />
                Edit
              </Link>
            }
          />
        </div>

        <div className="col-span-12 flex min-w-0 flex-col gap-gutter lg:col-span-4">
          <BentoCard title="Actions" subtitle="What you can do with this employee">
            <div className="flex flex-col gap-2">
              <Link href={editHref} className={ACTION}>
                <Icon name="edit" className="text-[20px] text-primary" />
                Edit details
                <Icon name="chevron_right" className="ml-auto text-outline" />
              </Link>
              <Link href={branchHref} className={ACTION}>
                <Icon name="groups" className="text-[20px] text-primary" />
                {employee.branchName ?? "Branch"} employees
                <Icon name="chevron_right" className="ml-auto text-outline" />
              </Link>
              {employee.branchId ? (
                <a href={`/api/employees/export?format=PDF&branchId=${employee.branchId}`} className={ACTION}>
                  <Icon name="picture_as_pdf" className="text-[20px] text-primary" />
                  Export the branch list (PDF)
                  <Icon name="download" className="ml-auto text-outline" />
                </a>
              ) : null}
            </div>
          </BentoCard>

          <BentoCard title="Contact">
            <div className="flex flex-col gap-2">
              {employee.phone ? (
                <a href={`tel:${employee.phone.replace(/\s+/g, "")}`} className={ACTION}>
                  <Icon name="call" className="text-[20px] text-primary" />
                  <span className="min-w-0 break-all">{employee.phone}</span>
                </a>
              ) : (
                <p className="text-sm text-on-surface-variant">No phone number recorded.</p>
              )}
              {employee.email ? (
                <a href={`mailto:${employee.email}`} className={ACTION}>
                  <Icon name="mail" className="text-[20px] text-primary" />
                  <span className="min-w-0 break-all">{employee.email}</span>
                </a>
              ) : null}
              {employee.emergencyContactPhone ? (
                <a href={`tel:${employee.emergencyContactPhone.replace(/\s+/g, "")}`} className={ACTION}>
                  <Icon name="emergency" className="text-[20px] text-error" />
                  <span className="min-w-0 break-words">
                    {employee.emergencyContactName ?? "Emergency contact"} · {employee.emergencyContactPhone}
                  </span>
                </a>
              ) : null}
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}
