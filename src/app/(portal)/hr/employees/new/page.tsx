import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";

/**
 * Add Employee form.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * UI ONLY — no server action wired yet. Once the Employee create endpoint
 * and its request DTO shape are confirmed, wire this to a Server Action
 * using `useActionState` per the `ActionState<T>` convention in types/index.ts.
 * ─────────────────────────────────────────────────────────────────────────
 */

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20";

const labelClass = "mb-1 block font-table-header text-table-header uppercase text-outline";

export default async function NewEmployeePage() {
  await requirePermission("employee:write");

  return (
    <>
      <PageHeader
        title="Add Employee"
        description="Create a new employee record."
        actions={
          <div className="flex gap-3">
            <Link
              href="/hr/employees"
              className="rounded-lg bg-blue-soft px-5 py-2 font-body-md text-body-md font-semibold text-primary-container transition-colors hover:bg-secondary-container"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="new-employee-form"
              className="rounded-lg bg-on-primary-fixed-variant px-5 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary"
            >
              Save Employee
            </button>
          </div>
        }
      />

      <form id="new-employee-form" className="grid grid-cols-1 gap-gutter pb-24 lg:grid-cols-12">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-8">
          <BentoCard title="Personal Details">
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} placeholder="John Doe" type="text" name="fullName" />
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input className={inputClass} type="date" name="dateOfBirth" />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select className={inputClass} name="gender" defaultValue="">
                  <option value="" disabled>Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>National ID</label>
                <input className={inputClass} placeholder="e.g. 12345678" type="text" name="nationalId" />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input className={inputClass} placeholder="+254 700 000000" type="tel" name="phone" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} placeholder="john.doe@company.com" type="email" name="email" />
              </div>
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="work" className="text-[20px] text-primary" />
                Employment
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>Profile Photo</label>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest p-6 transition-colors hover:bg-surface-container-low">
                  <Icon name="cloud_upload" className="mb-2 text-[32px] text-outline" />
                  <p className="font-body-md text-body-md font-medium text-on-surface-variant">
                    Drag and drop or click to upload
                  </p>
                  <p className="mt-1 text-[10px] text-outline">JPEG, PNG up to 2MB</p>
                </div>
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <select className={inputClass} name="departmentId" defaultValue="">
                  <option value="" disabled>Select Department</option>
                  <option value="1">Engineering</option>
                  <option value="2">Human Resources</option>
                  <option value="3">Sales</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Job Title</label>
                <input className={inputClass} placeholder="e.g. Software Engineer" type="text" name="position" />
              </div>
              <div>
                <label className={labelClass}>Branch</label>
                <select className={inputClass} name="branchId" defaultValue="">
                  <option value="" disabled>Select Branch</option>
                  <option value="1">Nairobi HQ</option>
                  <option value="2">Mombasa</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Date Hired</label>
                <input className={inputClass} type="date" name="dateHired" />
              </div>
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="payments" className="text-[20px] text-primary" />
                Compensation
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div>
                <label className={labelClass}>Basic Salary (KES)</label>
                <input className={inputClass} placeholder="0.00" type="number" name="basicSalary" />
              </div>
              <div>
                <label className={labelClass}>Payment Method</label>
                <select className={inputClass} name="paymentMethod" defaultValue="BANK">
                  <option value="BANK">Bank Transfer</option>
                  <option value="MPESA">M-Pesa</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Bank Name</label>
                <input className={inputClass} placeholder="e.g. Equity Bank" type="text" name="bankName" />
              </div>
            </div>
          </BentoCard>

          <BentoCard
            title={
              <span className="flex items-center gap-2">
                <Icon name="assured_workload" className="text-[20px] text-primary" />
                Statutory Details
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div>
                <label className={labelClass}>KRA PIN</label>
                <input className={`${inputClass} uppercase`} placeholder="A000000000X" type="text" name="kraPin" />
              </div>
              <div>
                <label className={labelClass}>NSSF No</label>
                <input className={inputClass} placeholder="Enter NSSF Number" type="text" name="nssfNumber" />
              </div>
              <div>
                <label className={labelClass}>SHIF No</label>
                <input className={inputClass} placeholder="Enter SHIF Number" type="text" name="shifNumber" />
              </div>
            </div>
          </BentoCard>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title="Guidance" className="border border-secondary-fixed bg-surface-bright">
            <ul className="flex flex-col gap-3 font-body-md text-body-md text-on-surface-variant">
              <li className="flex items-start gap-2">
                <Icon name="check_circle" className="mt-0.5 text-[14px] text-tertiary-container" />
                Ensure National ID matches the document.
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check_circle" className="mt-0.5 text-[14px] text-tertiary-container" />
                Statutory numbers are required for payroll.
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check_circle" className="mt-0.5 text-[14px] text-tertiary-container" />
                Profile photo must be under 2MB.
              </li>
            </ul>
          </BentoCard>

          <BentoCard title="Profile Preview" className="sticky top-24">
            <div className="mt-2 flex flex-col items-center text-center">
              <span className="mb-4 flex size-20 items-center justify-center rounded-full border-2 border-primary-fixed bg-surface-container-high">
                <Icon name="person" className="text-[32px] text-outline" />
              </span>
              <h4 className="text-[16px] font-bold text-on-surface">New Employee</h4>
              <p className="mb-1 font-body-md text-body-md font-medium text-primary">Department</p>
              <p className="flex items-center justify-center gap-1 text-[11px] text-outline">
                <Icon name="location_on" className="text-[14px]" />
                Branch Location
              </p>
              <div className="mt-6 flex w-full items-center justify-between border-t border-outline-variant/50 pt-4 text-[11px]">
                <span className="text-outline">Status</span>
                <span className="rounded bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                  DRAFT
                </span>
              </div>
            </div>
          </BentoCard>
        </div>
      </form>
    </>
  );
}