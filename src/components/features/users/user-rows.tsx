"use client";

import { useActionState } from "react";

import { assignUserBranchAction } from "@/app/actions/user";
import { FilterSelect } from "@/components/shared/filter-select";
import { ROLE_LABEL } from "@/config/roles";
import { initials } from "@/lib/format";
import type { ActionState, UserSummaryResponse } from "@/types";

/** One account: who they are, their login and whether it works. */
export function UserRow({ user, showRole = false }: { user: UserSummaryResponse; showRole?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary">
        {initials(user.displayName ?? user.username)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words font-semibold text-on-surface">{user.displayName ?? user.username}</p>
        <p className="break-all font-mono text-[11px] text-on-surface-variant">
          {user.username}
          {showRole ? <span className="font-sans"> · {ROLE_LABEL[user.role] ?? user.role}</span> : null}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${user.active ? "bg-tertiary-container/10 text-tertiary-container" : "bg-error/10 text-error"}`}>
        {user.active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

/** Puts a Back Office officer in a branch, or moves them to another. */
export function AssignBranchForm({
  userId,
  currentBranchId,
  branches,
}: {
  userId: number;
  currentBranchId: number | null;
  branches: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(assignUserBranchAction, { status: "idle" });

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex min-w-0 gap-2">
        <FilterSelect
          name={`branchId-${userId}`}
          label="Branch"
          className="flex-1"
          defaultValue={currentBranchId ? String(currentBranchId) : ""}
          options={[{ value: "", label: "Choose a branch" }, ...branches.map((branch) => ({ value: String(branch.id), label: branch.name }))]}
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state.status === "error" ? <span role="alert" className="text-xs text-error">{state.message}</span> : null}
    </form>
  );
}
