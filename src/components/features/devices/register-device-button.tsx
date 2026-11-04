"use client";

import { useActionState, useRef, useState } from "react";

import { registerDeviceAction, type RegisteredDevice } from "@/app/actions/device";
import { FormMessage, SelectField, TextField } from "@/components/shared/form-field";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/lib/toast";
import type { ActionState } from "@/types";

/** The token, shown once: only its scrambled form is stored, so it can never be read back. */
function NewDeviceToken({ device, onDone }: { device: RegisteredDevice; onDone: () => void }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(device.token);
      toast.success("Device token copied.");
    } catch {
      toast.error("Could not copy. Select the text instead.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="status" className="rounded-lg border border-tertiary-container/40 bg-tertiary-container/5 p-4">
        <p className="text-sm font-semibold text-on-surface">Copy this token now.</p>
        <p className="mt-0.5 text-xs text-on-surface-variant">
          Enter it in the attendance application on this terminal&rsquo;s PC. It cannot be shown again after you close this.
        </p>
        <dl className="mt-3 flex flex-col gap-2">
          <div className="min-w-0">
            <dt className="font-table-header text-table-header uppercase text-outline">Device serial</dt>
            <dd className="break-all font-mono text-sm text-on-surface">{device.deviceSerial}</dd>
          </div>
          <div className="min-w-0">
            <dt className="font-table-header text-table-header uppercase text-outline">Device token</dt>
            <dd className="break-all font-mono text-sm text-on-surface">{device.token}</dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          data-live=""
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <Icon name="content_copy" className="text-[18px]" />
          Copy
        </button>
        <button
          type="button"
          data-live=""
          onClick={onDone}
          className="min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function RegisterDeviceForm({ branches, onDone }: { branches: { id: number; name: string }[]; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<ActionState<RegisteredDevice>, FormData>(registerDeviceAction, { status: "idle" });
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  if (state.status === "success") return <NewDeviceToken device={state.data} onDone={onDone} />;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <SelectField label="Branch" name="branchId" required defaultValue="" error={errors?.branchId?.[0]}>
        <option value="" disabled>Choose a branch</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>{branch.name}</option>
        ))}
      </SelectField>
      <TextField
        label="Device serial"
        name="deviceSerial"
        required
        maxLength={100}
        autoComplete="off"
        spellCheck={false}
        hint="The serial number of the fingerprint reader at this branch."
        error={errors?.deviceSerial?.[0]}
      />
      <FormMessage state={state} successText="Device registered." />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          data-live=""
          onClick={onDone}
          className="min-h-11 rounded-lg border border-outline-variant px-5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Registering…" : "Register Device"}
        </button>
      </div>
    </form>
  );
}

/** Admin: registers a terminal for a branch and shows its token once, to enter on that branch's PC. */
export function RegisterDeviceButton({ branches }: { branches: { id: number; name: string }[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // A new key clears the form and the token once the pop-up closes, so neither is there next time.
  const [session, setSession] = useState(0);

  function close() {
    dialogRef.current?.close();
    setSession((current) => current + 1);
  }

  return (
    <>
      <button
        type="button"
        data-live=""
        onClick={() => dialogRef.current?.showModal()}
        className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-sm font-semibold text-white transition-colors hover:bg-primary-container"
      >
        <Icon name="add" className="text-[18px]" />
        Register Device
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Register a device"
        onClose={() => setSession((current) => current + 1)}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-card bg-surface-container-lowest p-5 text-on-surface shadow-ambient-1 backdrop:bg-black/40 sm:p-6"
      >
        <h2 className="mb-4 font-body-md text-lg font-semibold">Register a device</h2>
        <RegisterDeviceForm key={session} branches={branches} onDone={close} />
      </dialog>
    </>
  );
}
