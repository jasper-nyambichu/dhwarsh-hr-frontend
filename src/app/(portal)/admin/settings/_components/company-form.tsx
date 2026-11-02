"use client";

import { useActionState } from "react";

import { saveCompanyAction } from "@/app/actions/company";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage, TextField } from "@/components/shared/form-field";
import type { ActionState, CompanyResponse } from "@/types";

/** Company profile. Admin edits; everyone else with access sees it read-only. */
export function CompanyForm({
  initial,
  readOnly,
}: {
  initial: CompanyResponse | null;
  readOnly: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveCompanyAction, {
    status: "idle",
  });
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <ConfirmForm
      action={formAction}
      confirm={initial
        ? { title: "Save the company profile?", message: "The company's details will be updated.", confirmLabel: "Save", icon: "save" }
        : { title: "Create the company profile?", message: "The company will be set up with the details you entered.", confirmLabel: "Create", icon: "save" }}
    >
      <BentoCard title="Company Profile" subtitle={initial ? undefined : "Not set up yet — fill this in first."}>
        <fieldset disabled={readOnly || pending} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField className="sm:col-span-2" label="Registered name" name="name" required defaultValue={initial?.name} error={errors?.name?.[0]} />
          <TextField label="KRA PIN" name="kraPin" defaultValue={initial?.kraPin ?? undefined} />
          <TextField label="NSSF number" name="nssfNumber" defaultValue={initial?.nssfNumber ?? undefined} />
          <TextField label="SHIF number" name="shifNumber" defaultValue={initial?.shifNumber ?? undefined} />
          <TextField label="NITA number" name="nitaNumber" defaultValue={initial?.nitaNumber ?? undefined} />
          <TextField label="Email" name="email" type="email" defaultValue={initial?.email ?? undefined} error={errors?.email?.[0]} />
          <TextField label="Phone" name="phone" type="tel" defaultValue={initial?.phone ?? undefined} />
          <TextField className="sm:col-span-2" label="Address" name="address" defaultValue={initial?.address ?? undefined} />
          <TextField label="Website" name="website" defaultValue={initial?.website ?? undefined} />
          <TextField label="Currency" name="currency" defaultValue={initial?.currency ?? "KES"} />
          <TextField label="Timezone" name="timezone" defaultValue={initial?.timezone ?? "Africa/Nairobi"} />
        </fieldset>

        {!readOnly ? (
          <div className="mt-5 flex flex-col gap-3">
            <FormMessage state={state} successText="Company profile saved." />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-6 py-2.5 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Saving…" : initial ? "Save Company" : "Create Company"}
              </button>
            </div>
          </div>
        ) : null}
      </BentoCard>
    </ConfirmForm>
  );
}