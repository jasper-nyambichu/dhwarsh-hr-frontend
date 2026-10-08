"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  createEmployeeAction,
  updateEmployeeAction,
} from "@/app/actions/employee";
import { BentoCard } from "@/components/shared/bento-card";
import { SubmitButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useActionToast } from "@/hooks/use-action-toast";
import { toDateInput } from "@/lib/format";
import type {
  ActionState,
  AgentResponse,
  BranchResponse,
  DepartmentResponse,
  EmployeeResponse,
} from "@/types";

/**
 * The employee form, used by both /hr/employees/new and /hr/employees/[id]/edit.
 *
 * Its field list is `EmployeeRequest` and nothing else. Three absences are
 * deliberate and worth naming, because each one was a bug in the previous
 * version of this screen:
 *
 *  - **No employee number.** The service mints `EMP-<branchCode>-<seq>` and
 *    retries on collision. A field here would either be ignored or fight it.
 *  - **No employment status.** It is not on the request DTO. The entity
 *    defaults to ACTIVE. Only terminate changes it, and that is its own action.
 *  - **No payment method, no profile photo.** Neither endpoint exists. A
 *    control that silently discards a value is worse than no control.
 *
 * The Branch → Department cascade is not cosmetic: the service rejects a
 * department that does not belong to the chosen branch, so the department list
 * is filtered to the selected branch and cleared when the branch changes.
 */

export type EmployeeFormOptions = {
  branches: BranchResponse[];
  /** Keyed by branch id — one read per branch, done on the server. */
  departmentsByBranch: Record<number, DepartmentResponse[]>;
  agents: AgentResponse[];
};

export function EmployeeForm({
  mode,
  options,
  initial,
}: {
  mode: "create" | "edit";
  options: EmployeeFormOptions;
  initial?: EmployeeResponse;
}) {
  // Remounting on "Add another" resets both the uncontrolled inputs and the
  // useActionState result, which cannot be reset in place.
  const [instance, setInstance] = useState(0);

  return (
    <EmployeeFormInstance
      key={instance}
      mode={mode}
      options={options}
      initial={initial}
      onStartAnother={() => setInstance((n) => n + 1)}
    />
  );
}

function EmployeeFormInstance({
  mode,
  options,
  initial,
  onStartAnother,
}: {
  mode: "create" | "edit";
  options: EmployeeFormOptions;
  initial?: EmployeeResponse;
  onStartAnother: () => void;
}) {
  const action = mode === "create" ? createEmployeeAction : updateEmployeeAction;

  const [state, formAction] = useActionState<
    ActionState<EmployeeResponse>,
    FormData
  >(action, { status: "idle" });

  useActionToast(state, {
    success:
      mode === "create"
        ? (employee) => `${employee.fullName} created as ${employee.employeeNumber}`
        : "Employee updated",
  });

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const created = state.status === "success" ? state.data : undefined;

  // Branch and department are the one controlled pair on the form: the
  // department list is a function of the branch, and the service rejects a
  // department that belongs to a different branch. Every other field is
  // uncontrolled, so a failed submit leaves the user's typing in place.
  const [branchId, setBranchId] = useState(
    initial ? String(initial.branchId) : "",
  );
  const [departmentId, setDepartmentId] = useState(
    initial?.departmentId ? String(initial.departmentId) : "",
  );

  const departments = options.departmentsByBranch[Number(branchId)] ?? [];

  if (created && mode === "create") {
    return <CreatedPanel employee={created} onStartAnother={onStartAnother} />;
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-gutter pb-24 lg:grid-cols-12">
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      {/* ───────────────────────────────── main column ─────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-8">
        {state.status === "error" ? (
          <p
            role="alert"
            className="rounded-lg border border-error/40 bg-error/5 px-4 py-3 font-body-md text-body-md text-error"
          >
            {state.message}
          </p>
        ) : null}

        <BentoCard title="Personal Details">
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <Field
              label="Full Name"
              name="fullName"
              placeholder="John Doe"
              required
              defaultValue={initial?.fullName}
              error={errors?.fullName?.[0]}
            />
            <Field
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              defaultValue={toDateInput(initial?.dateOfBirth)}
              error={errors?.dateOfBirth?.[0]}
            />
            <Select
              label="Gender"
              name="gender"
              placeholder="Select Gender"
              defaultValue={initial?.gender ?? ""}
              error={errors?.gender?.[0]}
              options={[
                { value: "MALE", label: "Male" },
                { value: "FEMALE", label: "Female" },
                { value: "OTHER", label: "Other" },
              ]}
            />
            <Select
              label="Marital Status"
              name="maritalStatus"
              placeholder="Select Marital Status"
              defaultValue={initial?.maritalStatus ?? ""}
              error={errors?.maritalStatus?.[0]}
              options={[
                { value: "SINGLE", label: "Single" },
                { value: "MARRIED", label: "Married" },
                { value: "DIVORCED", label: "Divorced" },
                { value: "WIDOWED", label: "Widowed" },
              ]}
            />
            <Field
              label="National ID"
              name="nationalId"
              placeholder="e.g. 12345678"
              defaultValue={initial?.nationalId ?? undefined}
              error={errors?.nationalId?.[0]}
            />
            <Field
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="+254 700 000000"
              defaultValue={initial?.phone ?? undefined}
              error={errors?.phone?.[0]}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              placeholder="john.doe@company.com"
              defaultValue={initial?.email ?? undefined}
              error={errors?.email?.[0]}
            />
            <Field
              label="Address"
              name="address"
              placeholder="e.g. Kilimani, Nairobi"
              defaultValue={initial?.address ?? undefined}
              error={errors?.address?.[0]}
            />
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
            <Select
              label="Branch"
              name="branchId"
              placeholder="Select Branch"
              required
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                // A department from the previous branch would be rejected.
                setDepartmentId("");
              }}
              error={errors?.branchId?.[0]}
              options={options.branches.map((b) => ({
                value: String(b.id),
                label: `${b.name} (${b.code})`,
              }))}
            />
            <Select
              label="Department"
              name="departmentId"
              placeholder={
                !branchId
                  ? "Select a branch first"
                  : departments.length === 0
                    ? "No departments in this branch"
                    : "None"
              }
              disabled={!branchId}
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              error={errors?.departmentId?.[0]}
              options={departments.map((d) => ({
                value: String(d.id),
                label: d.name,
              }))}
            />
            <Select
              label="Employment Type"
              name="employmentType"
              placeholder="Select Employment Type"
              required
              defaultValue={initial?.employmentType ?? ""}
              error={errors?.employmentType?.[0]}
              options={[
                { value: "PERMANENT", label: "Permanent" },
                { value: "CONTRACT", label: "Contract" },
                { value: "CASUAL", label: "Casual" },
                { value: "OUTSOURCED", label: "Outsourced" },
              ]}
            />
            <Field
              label="Job Title"
              name="position"
              placeholder="e.g. Software Engineer"
              defaultValue={initial?.position ?? undefined}
              error={errors?.position?.[0]}
            />
            <Field
              label="Date Hired"
              name="dateHired"
              type="date"
              defaultValue={toDateInput(initial?.dateHired)}
              error={errors?.dateHired?.[0]}
            />
            <Select
              label="Agent"
              name="agentId"
              placeholder="None — direct employee"
              defaultValue={initial?.agentId ? String(initial.agentId) : ""}
              error={errors?.agentId?.[0]}
              options={options.agents.map((a) => ({
                value: String(a.id),
                label: a.name,
              }))}
            />
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
            <Field
              label="Basic Salary (KES)"
              name="basicSalary"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              defaultValue={initial?.basicSalary ?? undefined}
              error={errors?.basicSalary?.[0]}
            />
            <Field
              label="Bank Name"
              name="bankName"
              placeholder="e.g. Equity Bank"
              defaultValue={initial?.bankName ?? undefined}
              error={errors?.bankName?.[0]}
            />
            <Field
              label="Bank Account Number"
              name="bankAccountNumber"
              placeholder="e.g. 0123456789"
              defaultValue={initial?.bankAccountNumber ?? undefined}
              error={errors?.bankAccountNumber?.[0]}
            />
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
            <Field
              label="KRA PIN"
              name="kraPin"
              placeholder="A000000000X"
              className="uppercase"
              defaultValue={initial?.kraPin ?? undefined}
              error={errors?.kraPin?.[0]}
            />
            <Field
              label="NSSF No"
              name="nssfNumber"
              placeholder="Enter NSSF Number"
              defaultValue={initial?.nssfNumber ?? undefined}
              error={errors?.nssfNumber?.[0]}
            />
            <Field
              label="SHIF No"
              name="shifNumber"
              placeholder="Enter SHIF Number"
              defaultValue={initial?.shifNumber ?? undefined}
              error={errors?.shifNumber?.[0]}
            />
            <Field
              label="NITA No"
              name="nitaNumber"
              placeholder="Enter NITA Number"
              defaultValue={initial?.nitaNumber ?? undefined}
              error={errors?.nitaNumber?.[0]}
            />
          </div>
        </BentoCard>

        <BentoCard
          title={
            <span className="flex items-center gap-2">
              <Icon name="emergency" className="text-[20px] text-primary" />
              Emergency Contact
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <Field
              label="Contact Name"
              name="emergencyContactName"
              placeholder="e.g. Jane Doe"
              defaultValue={initial?.emergencyContactName ?? undefined}
              error={errors?.emergencyContactName?.[0]}
            />
            <Field
              label="Contact Phone"
              name="emergencyContactPhone"
              type="tel"
              placeholder="+254 700 000000"
              defaultValue={initial?.emergencyContactPhone ?? undefined}
              error={errors?.emergencyContactPhone?.[0]}
            />
          </div>
        </BentoCard>
      </div>

      {/* ──────────────────────────────── side column ──────────────────── */}
      <div className="flex flex-col gap-gutter lg:col-span-4">
        <BentoCard title="Guidance" className="border border-secondary-fixed bg-surface-bright">
          <ul className="flex flex-col gap-3 font-body-md text-body-md text-on-surface-variant">
            <li className="flex items-start gap-2">
              <Icon name="check_circle" className="mt-0.5 text-[14px] text-tertiary-container" />
              Only four fields are required: name, branch, employment type and
              basic salary.
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check_circle" className="mt-0.5 text-[14px] text-tertiary-container" />
              National ID must be unique — a duplicate is rejected by the server.
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check_circle" className="mt-0.5 text-[14px] text-tertiary-container" />
              Pick the branch first; the department list follows it.
            </li>
          </ul>
        </BentoCard>

        <BentoCard title="What the server fills in" className="sticky top-24">
          <dl className="flex flex-col gap-4 font-body-md text-body-md">
            <div>
              <dt className="font-table-header text-table-header uppercase text-outline">
                Employee Number
              </dt>
              <dd className="mt-1 text-on-surface-variant">
                Generated as <code className="text-[11px]">EMP-&lt;branch code&gt;-&lt;seq&gt;</code>{" "}
                when the record is saved.
              </dd>
            </div>
            <div>
              <dt className="font-table-header text-table-header uppercase text-outline">
                Employment Status
              </dt>
              <dd className="mt-1 text-on-surface-variant">
                Starts as <strong>Active</strong>. Termination is a separate
                action on the employee record.
              </dd>
            </div>
          </dl>
        </BentoCard>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/hr/employees"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-surface-container px-6 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Cancel
          </Link>
          <SubmitButton
            variant="primary"
            size="lg"
            icon="save"
            loadingText="Saving…"
          >
            {mode === "create" ? "Save Employee" : "Save Changes"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

/* ----------------------------------------------------------------- success */

function CreatedPanel({
  employee,
  onStartAnother,
}: {
  employee: EmployeeResponse;
  onStartAnother: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-card border border-tertiary-container/40 bg-tertiary-container/5 p-8 text-center">
      <Icon name="check_circle" className="text-[44px] text-tertiary-container" />
      <h2 className="mt-3 text-[18px] font-bold text-on-surface">
        {employee.fullName} was added
      </h2>
      <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
        Saved as{" "}
        <strong className="font-semibold text-on-surface">
          {employee.employeeNumber}
        </strong>{" "}
        in {employee.branchName ?? "their branch"}.
      </p>
      <p className="mx-auto mt-3 max-w-sm text-[11px] text-outline">
        That number was generated by the server, so seeing it here means the
        record reached the database.
      </p>

      <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onStartAnother}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-surface-container px-5 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
        >
          Add another
        </button>
        <Link
          href={`/hr/employees/${employee.id}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-body-md text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90"
        >
          <Icon name="person" className="text-[18px]" />
          View record
        </Link>
        <Link
          href="/hr/employees"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-surface-container px-5 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
        >
          Back to directory
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ fields */

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20";

const labelClass =
  "mb-1 block font-table-header text-table-header uppercase text-outline";

function Field({
  label,
  name,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={`employee-${name}`}>
        {label}
        {props.required ? <span className="ml-0.5 text-error">*</span> : null}
      </label>
      <input
        id={`employee-${name}`}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `employee-${name}-error` : undefined}
        className={`${inputClass} ${className ?? ""}`}
        {...props}
      />
      {error ? (
        <p id={`employee-${name}-error`} className="mt-1 text-[11px] text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Select({
  label,
  name,
  options,
  placeholder,
  error,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={`employee-${name}`}>
        {label}
        {props.required ? <span className="ml-0.5 text-error">*</span> : null}
      </label>
      <select
        id={`employee-${name}`}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `employee-${name}-error` : undefined}
        className={inputClass}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`employee-${name}-error`} className="mt-1 text-[11px] text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The department list is a function of the selected branch, not a fixed list.
 * That is a correctness requirement, not a nicety: `EmployeeServiceImpl` throws
 * when the department does not belong to the branch on the request, so a stale
 * department from a previously-selected branch would fail the whole submit.
 *
 * Every branch's departments are read once on the server and passed in as a
 * map, which costs one call per branch on page load and saves a round-trip on
 * every branch change. That is the right trade while branches number in the
 * single digits; at a hundred it would want an on-demand lookup instead.
 */
