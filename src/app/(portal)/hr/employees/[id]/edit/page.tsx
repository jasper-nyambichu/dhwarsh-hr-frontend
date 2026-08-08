import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatDate, initials } from "@/lib/format";
import type { EmployeeDetail } from "@/types";

/**
 * Edit Employee form.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * UI ONLY — pre-filled with placeholder data shaped against
 * `types.EmployeeDetail`. Wire to `PUT /employees/{id}` via a Server Action
 * once available, following the `ActionState<T>` convention.
 * ─────────────────────────────────────────────────────────────────────────
 */

const EMPLOYEE: EmployeeDetail = {
  id: 1,
  fullName: "Amina Yusuf",
  employeeNumber: "NCBD-0211",
  passportPhotoUrl: null,
  position: "Senior Financial Analyst",
  branchId: 1,
  branchName: "Nairobi CBD",
  departmentId: 3,
  departmentName: "Finance",
  agentId: null,
  agentName: undefined,
  employmentType: "PERMANENT",
  employmentStatus: "ACTIVE",
  dateHired: "2021-01-12",
  nationalId: "32451678",
  dateOfBirth: "1992-05-15",
  gender: "FEMALE",
  maritalStatus: "MARRIED",
  phone: "+254 712 345678",
  email: "amina.yusuf@dhwarsh.com",
  address: "Westlands, Nairobi",
  kraPin: "A001234567Z",
  shifNumber: "SHIF-45612",
  nssfNumber: "987654321",
  nitaNumber: null,
  basicSalary: 250_000,
  bankName: "Equity Bank",
  bankAccountNumber: "1234567890",
  emergencyContactName: null,
  emergencyContactPhone: null,
  createdAt: null,
  updatedAt: null,
  createdBy: null,
  updatedBy: null,
};

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20";

const labelClass = "mb-1 block font-table-header text-table-header uppercase text-outline";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("employee:write");
  const { id } = await params;
  const employee = EMPLOYEE; // TODO: fetch by `id` once the endpoint exists

  return (
    <>
      <PageHeader
        title={`Edit Employee: ${employee.fullName}`}
        description="Update employee records and compliance data."
        actions={
          <Link href={`/hr/employees/${id}`} className="flex items-center gap-1 font-body-md text-body-md text-secondary hover:text-primary">
            <Icon name="chevron_left" className="text-[18px]" />
            Back to Directory
          </Link>
        }
      />

      <form id="edit-employee-form" className="grid grid-cols-1 gap-gutter pb-24 lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-8">
          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="person" className="text-[20px] text-primary" />
                Personal Details
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} type="text" name="fullName" defaultValue={employee.fullName} />
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input className={inputClass} type="date" name="dateOfBirth" defaultValue={employee.dateOfBirth ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select className={inputClass} name="gender" defaultValue={employee.gender ?? ""}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>National ID</label>
                <input className={inputClass} type="text" name="nationalId" defaultValue={employee.nationalId ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input className={inputClass} type="email" name="email" defaultValue={employee.email ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input className={inputClass} type="tel" name="phone" defaultValue={employee.phone ?? ""} />
              </div>
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="work" className="text-[20px] text-primary" />
                Employment Information
              </span>
            }
          >
            <div className="mb-6 flex items-center gap-4 rounded-lg bg-surface-container-low p-4">
              <span
                aria-hidden
                className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-white bg-primary-container/20 text-xl font-bold text-primary-container shadow-sm"
              >
                {initials(employee.fullName)}
              </span>
              <div>
                <p className="font-body-md text-body-md font-semibold text-on-surface">Profile Photo</p>
                <p className="mb-2 text-[11px] text-on-surface-variant">JPG, GIF or PNG. Max size of 2MB.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-primary px-3 py-1 font-body-md text-[11px] font-semibold text-primary transition-colors hover:bg-primary-fixed"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-3 py-1 font-body-md text-[11px] font-semibold text-error transition-colors hover:bg-error-container"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div>
                <label className={labelClass}>Department</label>
                <select className={inputClass} name="departmentId" defaultValue={employee.departmentId ?? ""}>
                  <option value="1">Human Resources</option>
                  <option value="3">Finance</option>
                  <option value="2">Engineering</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Job Title</label>
                <input className={inputClass} type="text" name="position" defaultValue={employee.position ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Branch</label>
                <select className={inputClass} name="branchId" defaultValue={employee.branchId}>
                  <option value="1">Nairobi CBD</option>
                  <option value="2">Mombasa Branch</option>
                  <option value="3">Kisumu Branch</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Date Hired</label>
                <input
                  className={`${inputClass} cursor-not-allowed bg-surface-container-highest`}
                  type="text"
                  disabled
                  value={formatDate(employee.dateHired)}
                  readOnly
                />
              </div>
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="account_balance_wallet" className="text-[20px] text-primary" />
                Compensation & Banking
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div>
                <label className={labelClass}>Basic Salary (KES)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body-md text-body-md font-semibold text-on-surface-variant">
                    KES
                  </span>
                  <input
                    className={`${inputClass} pl-12`}
                    type="text"
                    name="basicSalary"
                    defaultValue={employee.basicSalary?.toLocaleString() ?? ""}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Payment Method</label>
                <select className={inputClass} name="paymentMethod" defaultValue="BANK">
                  <option value="BANK">Bank Transfer</option>
                  <option value="MPESA">Mobile Money (M-PESA)</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Bank Name</label>
                <input className={inputClass} type="text" name="bankName" defaultValue={employee.bankName ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input
                  className={inputClass}
                  type="text"
                  name="bankAccountNumber"
                  defaultValue={employee.bankAccountNumber ?? ""}
                />
              </div>
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="policy" className="text-[20px] text-primary" />
                Statutory Compliance
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div>
                <label className={labelClass}>KRA PIN</label>
                <input className={`${inputClass} font-mono uppercase`} type="text" name="kraPin" defaultValue={employee.kraPin ?? ""} />
              </div>
              <div>
                <label className={labelClass}>NSSF Number</label>
                <input className={`${inputClass} font-mono`} type="text" name="nssfNumber" defaultValue={employee.nssfNumber ?? ""} />
              </div>
              <div className="md:col-span-2 md:w-1/2">
                <label className={labelClass}>SHIF Number</label>
                <input
                  className={`${inputClass} font-mono uppercase`}
                  type="text"
                  name="shifNumber"
                  defaultValue={employee.shifNumber ?? ""}
                />
              </div>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <BentoCard className="relative overflow-hidden text-center">
            <span
              aria-hidden
              className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border-4 border-white bg-primary-container/20 text-2xl font-bold text-primary-container shadow-md"
            >
              {initials(employee.fullName)}
            </span>
            <h3 className="text-lg font-bold text-on-surface">{employee.fullName}</h3>
            <p className="mb-1 font-body-md text-body-md font-medium text-secondary">{employee.position}</p>
            <p className="mb-4 flex items-center justify-center gap-1 text-[11px] text-on-surface-variant">
              <Icon name="location_on" className="text-[14px]" />
              {employee.branchName}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-container/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-tertiary-container">
              <span className="size-1.5 rounded-full bg-tertiary-container" />
              Active Employee
            </span>
          </BentoCard>

          <BentoCard title="Data Integrity Rules" className="border border-primary-fixed bg-surface-bright">
            <ul className="flex flex-col gap-3 text-xs text-on-surface-variant">
              <li className="flex items-start gap-2">
                <Icon name="check_circle" className="mt-0.5 text-[16px] text-tertiary-container" />
                Ensure KRA PIN is exactly 11 characters starting with &lsquo;A&rsquo; and ending with a letter.
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check_circle" className="mt-0.5 text-[16px] text-tertiary-container" />
                Bank account details must exactly match the employee&rsquo;s payroll designation document.
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check_circle" className="mt-0.5 text-[16px] text-tertiary-container" />
                SHIF format is mandatory for compliance reporting.
              </li>
            </ul>
          </BentoCard>
        </div>
      </form>

      {/* sticky footer */}
      <div className="fixed bottom-0 right-0 z-40 flex w-[calc(100%-96px)] justify-end gap-4 border-t border-outline-variant bg-surface p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link
          href={`/hr/employees/${id}`}
          className="rounded-lg px-6 py-2 font-body-md text-body-md font-semibold text-secondary transition-colors hover:bg-surface-container"
        >
          Cancel
        </Link>
        <button
          type="submit"
          form="edit-employee-form"
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
        >
          <Icon name="save" className="text-[18px]" />
          Save Changes
        </button>
      </div>
    </>
  );
}