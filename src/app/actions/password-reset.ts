"use server";

import { redirect } from "next/navigation";

import { api } from "@/app/lib/api-client";
import { toActionError } from "@/app/lib/api-error";
import { resetPasswordSchema } from "@/app/lib/definitions";
import { flashToast } from "@/app/lib/flash";
import { ROLE_LOGIN, isRole } from "@/config/roles";
import type { ActionState } from "@/types";

/**
 * Forgotten passwords. None of these has a session, so each one checks its own input. The token is what
 * proves the code was right, and the backend only hands it to whoever submitted that code.
 */

const ANONYMOUS = { anonymous: true } as const;

export async function requestResetCodeAction(identifier: string): Promise<ActionState> {
  const value = identifier.trim();
  if (!value) return { status: "error", message: "Enter your username or email." };

  try {
    await api.post<void>("/auth/forgot-password", { identifier: value }, ANONYMOUS);
  } catch (error) {
    return toActionError(error);
  }
  return { status: "success", data: undefined };
}

export async function verifyResetCodeAction(identifier: string, code: string): Promise<ActionState<string>> {
  if (!/^\d{6}$/.test(code)) return { status: "error", message: "Enter the 6-digit code." };

  try {
    const { resetToken } = await api.post<{ resetToken: string }>("/auth/verify-reset-code", { identifier: identifier.trim(), code }, ANONYMOUS);
    return { status: "success", data: resetToken };
  } catch (error) {
    return toActionError(error);
  }
}

/** Sends them to the login page for their kind of account, where the toast confirms it worked. */
export async function resetPasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Check the fields below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let role: string;
  try {
    const result = await api.post<{ role: string }>(
      "/auth/reset-password",
      { resetToken: parsed.data.token, newPassword: parsed.data.newPassword },
      ANONYMOUS,
    );
    role = result.role;
  } catch (error) {
    return toActionError(error);
  }

  await flashToast("success", "Password changed. Sign in with your new password.");
  redirect(isRole(role) ? ROLE_LOGIN[role] : "/login");
}
