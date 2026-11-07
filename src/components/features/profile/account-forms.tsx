"use client";

import { useActionState, useRef, useState } from "react";

import {
  changeMyPasswordAction,
  removeMyPhotoAction,
  saveProfileAction,
  uploadMyPhotoAction,
} from "@/app/actions/profile";
import { FormMessage } from "@/components/shared/form-field";
import { PasswordField } from "@/components/shared/password-field";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Icon } from "@/components/ui/icon";
import { withToast } from "@/hooks/use-action-toast";
import { toast } from "@/lib/toast";
import type { ActionState } from "@/types";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const INPUT =
  "h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 font-body-md text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-fixed";
const FIELD_LABEL = "mb-1.5 block font-body-md text-sm font-semibold text-on-surface";
const SECONDARY_BUTTON =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60";
const PRIMARY_BUTTON =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60";

/** The photo with Upload and Remove. Choosing a file uploads it straight away. */
export function PhotoSection({ name, photoVersion }: { name: string; photoVersion: number | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, uploadAction, uploading] = useActionState<ActionState, FormData>(
    withToast(uploadMyPhotoAction, "Photo saved."),
    { status: "idle" },
  );
  const [, removeAction, removing] = useActionState<ActionState, FormData>(
    withToast(removeMyPhotoAction, "Photo removed."),
    { status: "idle" },
  );

  function onChoose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("The photo must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    formRef.current?.requestSubmit();
  }

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <UserAvatar name={name} photoVersion={photoVersion} size={80} />
      <div className="min-w-0">
        <h3 className="font-body-md text-body-md font-semibold text-on-surface">Profile Picture</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <form ref={formRef} action={uploadAction}>
            <label className={`${PRIMARY_BUTTON} cursor-pointer ${uploading ? "pointer-events-none opacity-60" : ""}`}>
              <Icon name="cloud_upload" className="text-[18px]" />
              {uploading ? "Uploading…" : "Upload Image"}
              <input type="file" name="file" accept="image/png,image/jpeg" onChange={onChoose} className="sr-only" />
            </label>
          </form>
          {photoVersion !== null ? (
            <form action={removeAction}>
              <button type="submit" disabled={removing} className={SECONDARY_BUTTON}>
                {removing ? "Removing…" : "Remove"}
              </button>
            </form>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-outline">We support PNG and JPEG images up to 5 MB.</p>
      </div>
    </section>
  );
}

/** Name and email. Changing the email asks for the current password, since it decides where resets go. */
export function ProfileForm({
  firstName,
  lastName,
  username,
  email,
}: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveProfileAction, { status: "idle" });
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [mail, setMail] = useState(email);
  const [password, setPassword] = useState("");

  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.status === "success") setPassword("");
  }

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const emailChanged = mail.trim().toLowerCase() !== email.toLowerCase();
  const dirty = first !== firstName || last !== lastName || emailChanged;

  function cancel() {
    setFirst(firstName);
    setLast(lastName);
    setMail(email);
    setPassword("");
  }

  // The password pop-up sits OUTSIDE this form: its fields are required, and inside the form the browser
  // refused to submit the profile while they were empty and hidden, so Save silently did nothing.
  // The buttons below reach the form through its id.
  return (
    <div className="flex flex-col">
    <form id="profile-form" action={formAction} className="flex flex-col">
      <div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={FIELD_LABEL}>First Name</label>
          <input id="firstName" name="firstName" required maxLength={70} autoComplete="given-name" value={first} onChange={(event) => setFirst(event.target.value)} className={INPUT} />
          {errors?.firstName ? <p className="mt-1 text-xs text-error">{errors.firstName[0]}</p> : null}
        </div>
        <div>
          <label htmlFor="lastName" className={FIELD_LABEL}>Last Name</label>
          <input id="lastName" name="lastName" maxLength={70} autoComplete="family-name" value={last} onChange={(event) => setLast(event.target.value)} className={INPUT} />
          {errors?.lastName ? <p className="mt-1 text-xs text-error">{errors.lastName[0]}</p> : null}
        </div>

        <div>
          <label htmlFor="profileEmail" className={FIELD_LABEL}>Email</label>
          <input id="profileEmail" name="email" type="email" maxLength={150} autoComplete="email" value={mail} onChange={(event) => setMail(event.target.value)} className={INPUT} />
          <p className="mt-1.5 text-xs text-outline">Your password reset code is sent here.</p>
          {errors?.email ? <p className="mt-1 text-xs text-error">{errors.email[0]}</p> : null}
        </div>
        <div>
          <label htmlFor="profileUsername" className={FIELD_LABEL}>Username</label>
          <input id="profileUsername" value={username} readOnly disabled className={`${INPUT} cursor-not-allowed bg-surface-container-low text-on-surface-variant`} />
          <p className="mt-1.5 text-xs text-outline">Used to log in. Only an Admin can change it.</p>
        </div>

        {emailChanged ? (
          <div className="sm:col-span-2">
            <label htmlFor="emailCurrentPassword" className={FIELD_LABEL}>Current password</label>
            <PasswordField
              id="emailCurrentPassword"
              name="currentPassword"
              required
              value={password}
              onChange={setPassword}
              className="h-11"
            />
            <p className="mt-1.5 text-xs text-outline">Needed to confirm it is you changing your email.</p>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <FormMessage state={state} successText="Profile saved." />
        </div>
      </div>
    </form>

      <PasswordSection />

      <div className="flex justify-end gap-3 border-t border-outline-variant/40 pt-5">
        <button type="button" data-live="" onClick={cancel} disabled={!dirty || pending} className={SECONDARY_BUTTON}>Cancel</button>
        <button type="submit" form="profile-form" disabled={!dirty || pending} className={PRIMARY_BUTTON}>{pending ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

function PasswordSection() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState(0);

  return (
    <section className="flex flex-col gap-3 border-t border-outline-variant/40 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="font-body-md text-body-md font-semibold text-on-surface">Password</h3>
        <p className="mt-0.5 text-xs text-on-surface-variant">Use a password nobody else knows. You will need your current one.</p>
      </div>
      <button type="button" data-live="" onClick={() => dialogRef.current?.showModal()} className={`${SECONDARY_BUTTON} shrink-0`}>
        Change Password
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Change password"
        onClose={() => setSession((current) => current + 1)}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-card bg-surface-container-lowest p-5 text-on-surface shadow-ambient-1 backdrop:bg-black/40 sm:p-6"
      >
        <h2 className="mb-4 font-body-md text-lg font-semibold">Change password</h2>
        <ChangePasswordBody key={session} onDone={() => dialogRef.current?.close()} />
      </dialog>
    </section>
  );
}

// Not a <form>: kept self-contained so it can never block another form again. The password fields have
// no name, so saving the profile never sends them, and they are submitted from here instead.
function ChangePasswordBody({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  async function submit() {
    const body = new FormData();
    body.set("currentPassword", current);
    body.set("newPassword", next);
    body.set("confirmPassword", confirm);

    setPending(true);
    const result = await changeMyPasswordAction({ status: "idle" }, body);
    setPending(false);
    setState(result);

    if (result.status === "success") {
      toast.success("Password changed.");
      onDone();
    } else if (result.status === "error" && !result.fieldErrors) {
      toast.error(result.message);
    }
  }

  return (
    <div
      className="flex flex-col gap-4"
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          void submit();
        }
      }}
    >
      <div>
        <label htmlFor="currentPassword" className={FIELD_LABEL}>Current password</label>
        <PasswordField id="currentPassword" name="" required value={current} onChange={setCurrent} invalid={Boolean(errors?.currentPassword)} className="h-11" />
        {errors?.currentPassword ? <p className="mt-1 text-xs text-error">{errors.currentPassword[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="newPassword" className={FIELD_LABEL}>New password</label>
        <PasswordField id="newPassword" name="" required autoComplete="new-password" value={next} onChange={setNext} invalid={Boolean(errors?.newPassword)} className="h-11" />
        <p className="mt-1 text-[11px] text-outline">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>
        {errors?.newPassword ? <p className="mt-1 text-xs text-error">{errors.newPassword[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="confirmPassword" className={FIELD_LABEL}>Confirm new password</label>
        <PasswordField id="confirmPassword" name="" required autoComplete="new-password" value={confirm} onChange={setConfirm} invalid={Boolean(errors?.confirmPassword)} className="h-11" />
        {errors?.confirmPassword ? <p className="mt-1 text-xs text-error">{errors.confirmPassword[0]}</p> : null}
      </div>
      {state.status === "error" && !errors ? <p role="alert" className="text-sm text-error">{state.message}</p> : null}
      <div className="flex justify-end gap-3">
        <button type="button" data-live="" onClick={onDone} className={SECONDARY_BUTTON}>Cancel</button>
        <button type="button" data-live="" disabled={pending} onClick={() => void submit()} className={PRIMARY_BUTTON}>
          {pending ? "Saving…" : "Change Password"}
        </button>
      </div>
    </div>
  );
}
