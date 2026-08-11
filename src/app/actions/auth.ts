"use server";

import { redirect } from "next/navigation";

import { env } from "@/config/env";
import { ROLE_HOME, isRole, type Role } from "@/config/roles";
import {
  agentLoginSchema,
  changePasswordSchema,
  employeeLoginSchema,
  loginSchema,
} from "@/app/lib/definitions";
import { createSession, deleteSession, getSession } from "@/app/lib/session";
import { toActionError } from "@/app/lib/api-error";
import type { ActionState } from "@/types";

/**
 * Auth actions. Mirrors `controller/auth` + `service/auth`.
 *
 * Every action here is reachable as a direct POST regardless of which
 * component imports it, so each one validates its own input independently.
 */

/**
 * `dto/response/auth/AuthResponse`, unwrapped from its ApiResponse envelope.
 * Identical across all three login surfaces.
 */
type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  role: string;
  displayName: string;
  employeeId: number | null;
  agentId: number | null;
  branchId: number | null;
  mustChangePassword: boolean;
};

const API_ROOT = env.API_BASE_URL.replace(/\/$/, "");
const AUTH_BASE = `${API_ROOT}/auth`;

/** Deliberately uniform — never reveal whether an identifier exists. */
const INVALID_CREDENTIALS = "Incorrect credentials. Please try again.";

async function authenticate(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<LoginResponse | { error: string }> {
  try {
    const response = await fetch(`${AUTH_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { error: INVALID_CREDENTIALS };
      }
      if (response.status === 423 || response.status === 429) {
        return {
          error: "Too many attempts. Your account is locked — contact HR.",
        };
      }
      return { error: "Unable to sign in right now. Please try again." };
    }

    const envelope = (await response.json()) as {
      success?: boolean;
      message?: string;
      data?: LoginResponse | null;
    };

    if (!envelope.success || !envelope.data?.accessToken) {
      return { error: INVALID_CREDENTIALS };
    }

    return envelope.data;
  } catch {
    return { error: "Unable to reach the server. Check your connection." };
  }
}

/** Persists the session, then redirects. Never returns. */
async function establishSession(
  result: LoginResponse,
  next?: string,
): Promise<never> {
  await createSession({
    userId: result.userId,
    username: result.username,
    displayName: result.displayName ?? result.username,
    role: result.role as Role,
    employeeId: result.employeeId,
    agentId: result.agentId,
    branchId: result.branchId,
    mustChangePassword: result.mustChangePassword,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  if (result.mustChangePassword) {
    redirect("/set-password");
  }

  // Only same-origin relative paths — blocks open redirect via ?next=
  const destination =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : ROLE_HOME[result.role as Role];

  redirect(destination);
}

/* ------------------------------------------------------------ staff login */

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { username, password, next } = parsed.data;
  const result = await authenticate("/login", { username, password });

  if ("error" in result) {
    return { status: "error", message: result.error };
  }

  if (!isRole(result.role)) {
    return {
      status: "error",
      message: "Your account has an unrecognised role. Contact an administrator.",
    };
  }

  return establishSession(result, next);
}

/* --------------------------------------------------------- employee login */

export async function employeeLogin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = employeeLoginSchema.safeParse({
    employeeNumber: formData.get("employeeNumber"),
    pin: formData.get("pin"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await authenticate("/employee-login", parsed.data);

  if ("error" in result) {
    return { status: "error", message: result.error };
  }

  if (!isRole(result.role)) {
    return {
      status: "error",
      message: "Your account has an unrecognised role. Contact HR.",
    };
  }

  return establishSession(result);
}

/* ------------------------------------------------------------ agent login */

export async function agentLogin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = agentLoginSchema.safeParse({
    agentCode: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await authenticate("/agent-login", parsed.data);

  if ("error" in result) {
    return { status: "error", message: result.error };
  }

  if (!isRole(result.role)) {
    return {
      status: "error",
      message: "Your account has an unrecognised role. Contact support.",
    };
  }

  return establishSession(result);
}

/* --------------------------------------------------- forced password reset */

export async function setPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // The change-password endpoint lives on UserController, not the auth
    // controller, and is keyed by user id — `#userId == authentication
    // .principal.id or hasRole('SUPER_ADMIN')` guards it server-side.
    const response = await fetch(
      `${API_ROOT}/users/${session.userId}/change-password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: parsed.data.currentPassword,
          newPassword: parsed.data.newPassword,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        status: "error",
        message:
          response.status === 400 || response.status === 401
            ? "Your current password is incorrect."
            : "Unable to update your password. Please try again.",
        fieldErrors:
          response.status === 400 || response.status === 401
            ? { currentPassword: ["Incorrect password."] }
            : undefined,
      };
    }
  } catch (error) {
    return toActionError(error);
  }

  // Clear must_change_password by re-issuing the cookie.
  await createSession({ ...session, mustChangePassword: false });

  redirect(ROLE_HOME[session.role]);
}

/* ----------------------------------------------------------------- logout */

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
