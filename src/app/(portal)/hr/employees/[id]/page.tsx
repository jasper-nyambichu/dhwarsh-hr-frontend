import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { BentoCard } from "@/components/shared/bento-card";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { formatDate, initials } from "@/lib/format";
import type { EmployeeDetail } from "@/types";

/**
 * Employee detail — Overview tab only.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DATA IS PLACEHOLDER — shaped against `types.EmployeeDetail`. Swap for
 * `await api.get<EmployeeDetail>(`/employees/${id}`)` when ready. The other
 * tabs (Employment, Attendance, Leave, Loans, Payslips, Documents, Audit)
 * are not yet wired — only Overview renders real content below.
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

const TABS = ["Overview", "Employment", "Attendance", "Leave", "Loans", "Payslips", "Documents", "Audit"] as const;

const ATTENDANCE_MONTH = { present: 20, absent: 1, late: 0, pct: 96 };

const LEAVE_BALANCES = [
  { label: "Annual Leave", used: 14, total: 21, color: "bg-primary-container" },
  { label: "Sick Leave", used: 2, total: 14, color: "bg-amber-main" },
  { label: "Compassionate", used: 0, total: 5, color: "bg-outline-variant" },
] as const;

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("employee:read");
  const { id } = await params;
  const employee = EMPLOYEE; // TODO: fetch by `id` once the endpoint exists

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/hr/employees"
              aria-label="Back to employee directory"
              className="text-on-surface-variant hover:text-on-surface"
            >
              <Icon name="arrow_back" />
            </Link>
            {employee.fullName}
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-full bg-tertiary-container/10 px-3 py-1 font-body-md text-[12px] font-semibold text-tertiary-container">
              <span className="size-2 rounded-full bg-tertiary-container" />
              Active
            </span>
            <Link
              href={`/hr/employees/${id}/edit`}
              className="rounded-lg border border-primary-container px-4 py-2 font-body-md text-body-md font-semibold text-primary-container transition-colors hover:bg-secondary-container/20"
            >
              Edit Profile
            </Link>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-on-primary-fixed-variant px-4 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary"
            >
              Actions
              <Icon name="expand_more" className="text-sm" />
            </button>
          </div>
        }
      />

      {/* ───────────────────────────────── identity band ─────────────────── */}
      <BentoCard className="mb-gutter flex items-center gap-6">
        <span
          aria-hidden
          className="flex size-16 items-center justify-center rounded-full bg-primary-container/20 text-2xl font-bold text-primary-container"
        >
          {initials(employee.fullName)}
        </span>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-3">
            <h2 className="text-[18px] font-bold text-on-surface">{employee.fullName}</h2>
            <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
              {employee.employeeNumber}
            </span>
          </div>
          <div className="mb-4 font-body-md text-body-md text-on-surface-variant">
            {employee.position} · {employee.departmentName}
          </div>
          <div className="flex items-center gap-8">
            <div>
              <div className="mb-1 font-table-header text-table-header uppercase text-on-surface-variant">Branch</div>
              <div className="font-body-md text-body-md font-semibold text-on-surface">{employee.branchName}</div>
            </div>
            <div>
              <div className="mb-1 font-table-header text-table-header uppercase text-on-surface-variant">Date Hired</div>
              <div className="font-body-md text-body-md font-semibold text-on-surface">
                {formatDate(employee.dateHired)}
              </div>
            </div>
            <div>
              <div className="mb-1 font-table-header text-table-header uppercase text-on-surface-variant">
                Employment Type
              </div>
              <div className="font-body-md text-body-md font-semibold text-on-surface">Full-Time</div>
            </div>
          </div>
        </div>
      </BentoCard>

      <div className="grid grid-cols-12 gap-gutter">
        {/* ───────────────────────────────── main column ─────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-8">
          <div className="flex gap-6 border-b border-outline-variant px-2 pb-2">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                type="button"
                className={
                  i === 0
                    ? "-mb-[9px] border-b-2 border-primary pb-2 font-body-md text-[14px] font-semibold text-primary"
                    : "pb-2 font-body-md text-[14px] text-on-surface-variant transition-colors hover:text-primary"
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <BentoCard
            title="Personal Details"
            action={<Icon name="edit" className="text-sm text-primary" />}
          >
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="Full Name" value={employee.fullName} />
              <Field label="Gender" value={employee.gender ?? "—"} />
              <Field label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
              <Field label="Marital Status" value={employee.maritalStatus ?? "—"} />
              <Field label="Email Address" value={employee.email ?? "—"} />
              <Field label="Phone Number" value={employee.phone ?? "—"} />
              <Field label="Physical Address" value={employee.address ?? "—"} span2 />
            </div>
          </BentoCard>

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <BentoCard title="Government IDs">
              <dl className="flex flex-col gap-3">
                <Row label="National ID" value={employee.nationalId ?? "—"} />
                <Row label="KRA PIN" value={employee.kraPin ?? "—"} />
                <Row label="NSSF No" value={employee.nssfNumber ?? "—"} />
                <Row label="SHIF No" value={employee.shifNumber ?? "—"} last />
              </dl>
            </BentoCard>

            <BentoCard title="Bank Details">
              <dl className="flex flex-col gap-3">
                <Row label="Bank Name" value={employee.bankName ?? "—"} />
                <Row label="Account Name" value={employee.fullName} />
                <Row label="Account Number" value={employee.bankAccountNumber ?? "—"} last />
              </dl>
            </BentoCard>
          </div>
        </div>

        {/* ──────────────────────────────── side column ──────────────────── */}
        <div className="col-span-12 flex flex-col gap-gutter lg:col-span-4">
          <BentoCard title="Current Month Attendance" className="flex flex-col items-center">
            <div className="relative mb-4 size-32">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-surface-container)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="var(--color-primary-container)"
                  strokeWidth="8"
                  strokeDasharray={`${(ATTENDANCE_MONTH.pct / 100) * 251.2} 251.2`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-card-stat text-card-stat text-on-surface">{ATTENDANCE_MONTH.pct}%</span>
              </div>
            </div>
            <div className="flex w-full justify-between px-2">
              <Stat label="Present" value={ATTENDANCE_MONTH.present} />
              <Stat label="Absent" value={ATTENDANCE_MONTH.absent} tone="text-error" />
              <Stat label="Late" value={ATTENDANCE_MONTH.late} tone="text-amber-main" />
            </div>
          </BentoCard>

          <BentoCard title="Leave Balances">
            <div className="flex flex-col gap-4">
              {LEAVE_BALANCES.map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between">
                    <span className="font-body-md text-body-md font-semibold text-on-surface">{row.label}</span>
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {row.used} / {row.total} days
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-container-high">
                    <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${(row.used / row.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard title="Reporting Manager">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-sm font-bold text-on-secondary-container"
              >
                PK
              </span>
              <div className="flex-1">
                <div className="font-body-md text-body-md font-bold text-on-surface">Peter Kamau</div>
                <div className="font-body-md text-[10px] text-on-surface-variant">Branch Manager</div>
              </div>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-secondary-container/30 text-primary-container transition-colors hover:bg-secondary-container"
              >
                <Icon name="mail" className="text-sm" />
              </button>
            </div>
          </BentoCard>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, span2 }: { label: string; value: string; span2?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : undefined}>
      <div className="mb-1 font-table-header text-table-header uppercase text-on-surface-variant">{label}</div>
      <div className="font-body-md text-body-md text-on-surface">{value}</div>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={last ? "flex justify-between" : "flex justify-between border-b border-outline-variant/30 pb-2"}>
      <span className="font-table-header text-table-header uppercase text-on-surface-variant">{label}</span>
      <span className="font-body-md text-body-md font-semibold text-on-surface">{value}</span>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="text-center">
      <div className="mb-1 font-table-header text-table-header uppercase text-on-surface-variant">{label}</div>
      <div className={`font-body-md text-body-md font-bold ${tone ?? "text-on-surface"}`}>{value}</div>
    </div>
  );
}