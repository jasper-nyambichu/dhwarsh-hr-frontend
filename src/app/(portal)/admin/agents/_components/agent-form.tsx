"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createAgentAction, updateAgentAction } from "@/app/actions/agent";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { BentoCard } from "@/components/shared/bento-card";
import { FormMessage, SelectField, TextField } from "@/components/shared/form-field";
import type { ActionState, AgentResponse, ChargeType } from "@/types";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Register or edit a labour agent: the company, its service fee and its director. */
export function AgentForm({ initial }: { initial?: AgentResponse }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    initial ? updateAgentAction : createAgentAction,
    { status: "idle" },
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const [feeType, setFeeType] = useState<ChargeType>(initial?.chargeType ?? "FIXED_MONTHLY");
  const [photoTooLarge, setPhotoTooLarge] = useState(false);
  const percentage = feeType === "PERCENTAGE_OF_GROSS";
  const initialFee = initial?.chargeType === "PERCENTAGE_OF_GROSS" ? initial.chargePercentage : initial?.chargeAmount;

  return (
    <ConfirmForm
      action={formAction}
      confirm={initial ? { title: "Save these changes?", message: "The agent's details will be updated.", confirmLabel: "Save", icon: "save" } : { title: "Register this agent?", message: "The agent will be added with the details you entered.", confirmLabel: "Register", icon: "handshake" }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-gutter"
    >
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <BentoCard title="Company details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Company name" name="name" required className="sm:col-span-2" defaultValue={initial?.name} error={errors?.name?.[0]} />
          <TextField label="Phone no." name="phone" type="tel" required defaultValue={initial?.phone ?? undefined} error={errors?.phone?.[0]} />
          <TextField label="Email" name="email" type="email" required defaultValue={initial?.email ?? undefined} error={errors?.email?.[0]} />
          <TextField label="Address" name="address" required className="sm:col-span-2" defaultValue={initial?.address ?? undefined} error={errors?.address?.[0]} />
          <SelectField
            label="Service fee is charged"
            name="chargeType"
            required
            value={feeType}
            onChange={(event) => setFeeType(event.target.value as ChargeType)}
            error={errors?.chargeType?.[0]}
          >
            <option value="FIXED_MONTHLY">Fixed amount per month</option>
            <option value="PER_EMPLOYEE">Per employee</option>
            <option value="PERCENTAGE_OF_GROSS">Percentage of pay</option>
            {initial?.chargeType === "CUSTOM" ? <option value="CUSTOM">Custom amount</option> : null}
          </SelectField>
          <TextField
            label={percentage ? "Service fee (%)" : "Service fee (KES)"}
            name="serviceFee"
            type="number"
            min="0"
            max={percentage ? "100" : undefined}
            step="0.01"
            inputMode="decimal"
            required
            defaultValue={initialFee ?? undefined}
            error={errors?.serviceFee?.[0]}
          />
        </div>
      </BentoCard>

      <BentoCard title="Director details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Director name" name="directorName" required defaultValue={initial?.directorName ?? undefined} error={errors?.directorName?.[0]} />
          <label className="flex min-w-0 flex-col gap-1 font-table-header text-table-header uppercase text-outline">
            Director ID photo
            <input
              type="file"
              name="directorIdPhoto"
              accept="image/png,image/jpeg"
              onChange={(event) => setPhotoTooLarge((event.target.files?.[0]?.size ?? 0) > MAX_PHOTO_BYTES)}
              className="min-h-11 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-2 text-sm font-normal normal-case text-on-surface-variant"
            />
            <span className={`text-[11px] font-normal normal-case ${photoTooLarge ? "text-error" : "text-outline"}`}>
              {photoTooLarge
                ? "That photo is too large. Choose one under 5 MB."
                : initial?.directorIdOnFile
                  ? "A photo is on file. Choosing another replaces it."
                  : "PNG or JPEG, up to 5 MB. Optional."}
            </span>
          </label>
        </div>
      </BentoCard>

      <FormMessage state={state} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={initial ? `/admin/agents/${initial.id}` : "/admin/agents"}
          className="flex min-h-11 items-center justify-center rounded-lg border border-outline-variant px-5 py-2 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          Back
        </Link>
        <button
          type="submit"
          disabled={pending || photoTooLarge}
          className="min-h-11 rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : initial ? "Save Changes" : "Register Agent"}
        </button>
      </div>
    </ConfirmForm>
  );
}
