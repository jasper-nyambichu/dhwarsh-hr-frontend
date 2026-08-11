"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useActionToast } from "@/hooks/use-action-toast";
import { updateMyProfile } from "@/app/actions/profile";
import type { ActionState } from "@/types";

/**
 * Editable half of the profile screen.
 *
 * Client Component because it owns form state and the save result; the
 * read-only employment panel beside it stays on the server.
 *
 * The fields here are the ones an employee may change about themselves.
 * Employee number, hire date, department and branch are deliberately absent —
 * those are HR-owned and render as locked text in the sibling panel.
 */

export type ProfileFormData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  email: string;
  phone: string;
  address: string;
};

export function ProfileForm({ initial }: { initial: ProfileFormData }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateMyProfile,
    { status: "idle" },
  );

  useActionToast(state, { success: "Profile updated" });

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form
      action={formAction}
      className="space-y-gutter md:col-span-8"
      data-live-region
    >
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient-1 sm:p-8">
        <h3 className="mb-6 flex items-center gap-2 border-b border-outline-variant/30 pb-2 text-[10px] font-semibold uppercase tracking-wider text-secondary">
          <Icon name="person" className="text-[18px]" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field
            label="First Name"
            name="firstName"
            defaultValue={initial.firstName}
            error={fieldErrors?.firstName?.[0]}
            required
          />
          <Field
            label="Last Name"
            name="lastName"
            defaultValue={initial.lastName}
            error={fieldErrors?.lastName?.[0]}
            required
          />
          <Field
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            defaultValue={initial.dateOfBirth}
            error={fieldErrors?.dateOfBirth?.[0]}
          />
          <SelectField
            label="Gender"
            name="gender"
            defaultValue={initial.gender}
            options={["Male", "Female", "Other"]}
            error={fieldErrors?.gender?.[0]}
          />
          <SelectField
            label="Marital Status"
            name="maritalStatus"
            defaultValue={initial.maritalStatus}
            options={["Single", "Married", "Divorced", "Widowed"]}
            error={fieldErrors?.maritalStatus?.[0]}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient-1 sm:p-8">
        <h3 className="mb-6 flex items-center gap-2 border-b border-outline-variant/30 pb-2 text-[10px] font-semibold uppercase tracking-wider text-secondary">
          <Icon name="contact_mail" className="text-[18px]" />
          Contact Details
        </h3>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={initial.email}
            error={fieldErrors?.email?.[0]}
            required
          />
          <Field
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={initial.phone}
            error={fieldErrors?.phone?.[0]}
            required
          />
          <div className="sm:col-span-2">
            <Field
              label="Address"
              name="address"
              defaultValue={initial.address}
              error={fieldErrors?.address?.[0]}
            />
          </div>
        </div>
      </div>

      {/* Stacks on mobile so neither button is squeezed below a usable width. */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <SubmitButton variant="primary" size="lg" icon="save" loadingText="Saving…">
          Save Changes
        </SubmitButton>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ fields */

function Field({
  label,
  name,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
}) {
  const id = `profile-${name}`;

  return (
    <div className="flex min-w-0 flex-col">
      <label
        htmlFor={id}
        className="mb-1.5 font-body-md text-body-md font-semibold text-on-surface"
      >
        {label}
        {props.required ? <span className="ml-0.5 text-error">*</span> : null}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-10 w-full min-w-0 rounded-lg border bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface transition-shadow placeholder:text-outline-variant focus:outline-none focus:ring-1 ${
          error
            ? "border-error focus:border-error focus:ring-error/30"
            : "border-outline-variant focus:border-primary focus:ring-primary/30"
        }`}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[10px] text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  error?: string;
}) {
  const id = `profile-${name}`;

  return (
    <div className="flex min-w-0 flex-col">
      <label
        htmlFor={id}
        className="mb-1.5 font-body-md text-body-md font-semibold text-on-surface"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          className={`h-10 w-full min-w-0 appearance-none rounded-lg border bg-surface-container-lowest px-3 pr-9 font-body-md text-body-md text-on-surface transition-shadow focus:outline-none focus:ring-1 ${
            error
              ? "border-error focus:border-error focus:ring-error/30"
              : "border-outline-variant focus:border-primary focus:ring-primary/30"
          }`}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Icon
          name="expand_more"
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-outline"
        />
      </div>
      {error ? <p className="mt-1 text-[10px] text-error">{error}</p> : null}
    </div>
  );
}
