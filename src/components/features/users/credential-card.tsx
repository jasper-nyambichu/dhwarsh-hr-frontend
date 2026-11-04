"use client";

import { useActionState, useState, type ReactNode } from "react";

import { deleteUserAction, saveCredentialsAction, type SavedCredentials } from "@/app/actions/user";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage, TextField } from "@/components/shared/form-field";
import { PasswordField } from "@/components/shared/password-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/lib/toast";
import type { ActionState, Role } from "@/types";

/** The saved login, shown once: a password is stored scrambled, so it can never be read back. */
function ShareCredentials({ saved, signInPath }: { saved: SavedCredentials; signInPath: string }) {
  const signInAt = `${window.location.origin}${signInPath}`;
  const rows: [string, string][] = [
    ["Username", saved.username],
    ["Password", saved.password ?? "Unchanged"],
    ["Sign in at", signInAt],
  ];

  async function copy() {
    const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Credentials copied.");
    } catch {
      toast.error("Could not copy. Select the text instead.");
    }
  }

  return (
    <div role="status" className="mt-4 rounded-lg border border-tertiary-container/40 bg-tertiary-container/5 p-4">
      <p className="text-sm font-semibold text-on-surface">Saved. Share these now.</p>
      {saved.password ? <p className="mt-0.5 text-xs text-on-surface-variant">The password cannot be shown again after you leave this page.</p> : null}
      <dl className="mt-3 flex flex-col gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="font-table-header text-table-header uppercase text-outline">{label}</dt>
            <dd className="break-all font-mono text-sm text-on-surface">{value}</dd>
          </div>
        ))}
      </dl>
      <button data-live=""
        type="button"
        onClick={copy}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
      >
        <Icon name="content_copy" className="text-[18px]" />
        Copy
      </button>
    </div>
  );
}

/**
 * The username and password for one login: a Branch Manager, a Back Office or an agent. The same card
 * sets a new login and changes an existing one, so every branch and agent is managed the same way.
 */
export function CredentialCard({
  title,
  subtitle,
  where,
  account,
  branchId,
  role,
  agentId,
  signInPath = "/login",
  children,
}: {
  title: string;
  subtitle?: string;
  /** Finishes "Whoever has these can sign in to …". */
  where: string;
  account: { id: number; username: string; email?: string | null; active: boolean } | null;
  branchId?: number;
  role?: Extract<Role, "BRANCH_MANAGER" | "BACK_OFFICE">;
  agentId?: number;
  signInPath?: string;
  /** Anything else about this login, shown below its credentials. */
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<ActionState<SavedCredentials>, FormData>(saveCredentialsAction, { status: "idle" });
  // Held here because React empties a form after its action, and a refused username should stay to be corrected.
  const [username, setUsername] = useState(account?.username ?? "");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(account?.email ?? "");
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.status === "success") setPassword("");
  }

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const passwordError = errors?.password?.[0];

  return (
    <BentoCard
      title={title}
      subtitle={subtitle}
      action={account ? (
        <span className="flex items-center gap-2">
          <StatusBadge status={account.active ? "ACTIVE" : "INACTIVE"} />
          <ConfirmDeleteButton
            compact
            action={deleteUserAction}
            id={account.id}
            name={account.username}
            label="Delete login"
            title="Delete this login?"
            confirmText="They will be signed out and unable to log in."
          />
        </span>
      ) : <StatusBadge status="NOT_SET" />}
    >
      <ConfirmForm
        action={formAction}
        confirm={{
          title: account ? "Change these credentials?" : "Save these credentials?",
          message: `Whoever has them can sign in to ${where}.`,
          subject: username,
          confirmLabel: "Save",
          icon: "key",
        }}
        className="flex flex-col gap-4"
      >
        {account ? <input type="hidden" name="userId" value={account.id} /> : null}
        {branchId ? <input type="hidden" name="branchId" value={branchId} /> : null}
        {role ? <input type="hidden" name="role" value={role} /> : null}
        {agentId ? <input type="hidden" name="agentId" value={agentId} /> : null}

        <TextField
          label="Username"
          name={`username-${role ?? "agent"}-${branchId ?? agentId ?? account?.id}`}
          required
          minLength={3}
          maxLength={50}
          autoComplete="off"
          spellCheck={false}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          error={errors?.username?.[0]}
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          maxLength={150}
          autoComplete="off"
          hint="Where their password reset code is sent. Without one they cannot reset it themselves."
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors?.email?.[0]}
        />

        <div>
          <label htmlFor={`password-${role ?? "agent"}-${branchId ?? agentId ?? account?.id}`} className="mb-1 block font-table-header text-table-header uppercase text-outline">
            {account ? "New password" : "Password"}
            {account ? null : <span className="ml-0.5 text-error">*</span>}
          </label>
          <PasswordField
            id={`password-${role ?? "agent"}-${branchId ?? agentId ?? account?.id}`}
            name="password"
            required={!account}
            autoComplete="new-password"
            invalid={Boolean(passwordError)}
            placeholder={account ? "Leave blank to keep it" : "••••••••"}
            value={password}
            onChange={setPassword}
            className="py-2.5"
          />
          <p className="mt-1 text-[11px] text-outline">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>
          {passwordError ? <p className="mt-1 text-xs text-error">{passwordError}</p> : null}
        </div>

        <FormMessage state={state} successText="Credentials saved." />

        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60 sm:self-start"
        >
          {pending ? "Saving…" : account ? "Save Changes" : "Save Credentials"}
        </button>
      </ConfirmForm>

      {state.status === "success" ? <ShareCredentials saved={state.data} signInPath={signInPath} /> : null}
      {children}
    </BentoCard>
  );
}
