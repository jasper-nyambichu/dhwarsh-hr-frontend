import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import {
  ROLE_HOME,
  canAccessPath,
  hasAnyPermission,
  hasPermission,
  type Permission,
  type Role,
} from "@/config/roles";
import type { CurrentUser } from "@/types";

import { getSession, type SessionPayload } from "./session";

/**
 * Data Access Layer. Mirrors `security/AccessGuard`.
 *
 * Every protected page and Server Action calls through here. Wrapped in
 * React `cache()` so repeated calls inside one render pass hit once.
 *
 * This is a UX gate, not the security boundary — the Spring AccessGuard
 * re-authorizes every request regardless of what happens here.
 */

/** Redirects to /login when there is no valid session. */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Forced rotation on `users.must_change_password`.
  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  return session;
});

/** Returns the session without redirecting. For optional-auth surfaces. */
export const getOptionalSession = cache(
  async (): Promise<SessionPayload | undefined> => getSession(),
);

/**
 * Session check for the /set-password route itself.
 *
 * `verifySession()` bounces a flagged session to /set-password, so that page
 * cannot call it without looping. This variant requires a valid session but
 * tolerates the `mustChangePassword` flag.
 */
export const verifySessionAllowingPasswordChange = cache(
  async (): Promise<SessionPayload> => {
    const session = await getSession();

    if (!session) {
      redirect("/login");
    }

    return session;
  },
);

/** Client-safe projection. Never leaks `accessToken`. */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await verifySession();

  return {
    id: session.userId,
    username: session.username,
    displayName: session.username,
    role: session.role,
    employeeId: session.employeeId,
    agentId: session.agentId,
    branchId: session.branchId,
    active: true,
    mustChangePassword: session.mustChangePassword,
  };
});

/** Backend JWT for outbound API calls. Server-side only. */
export const getAccessToken = cache(async (): Promise<string> => {
  const session = await verifySession();
  return session.accessToken;
});

/**
 * Asserts the caller holds `permission`, else bounces to their own home.
 * Use at the top of every Server Action and protected page.
 */
export async function requirePermission(
  permission: Permission,
): Promise<SessionPayload> {
  const session = await verifySession();

  if (!hasPermission(session.role, permission)) {
    redirect(ROLE_HOME[session.role]);
  }

  return session;
}

export async function requireAnyPermission(
  permissions: readonly Permission[],
): Promise<SessionPayload> {
  const session = await verifySession();

  if (!hasAnyPermission(session.role, permissions)) {
    redirect(ROLE_HOME[session.role]);
  }

  return session;
}

/** Asserts the caller's role matches one of `roles`. */
export async function requireRole(
  roles: readonly Role[],
): Promise<SessionPayload> {
  const session = await verifySession();

  if (!roles.includes(session.role)) {
    redirect(ROLE_HOME[session.role]);
  }

  return session;
}

/** Asserts `pathname` is inside the namespace the caller's role owns. */
export async function requireNamespace(
  pathname: string,
): Promise<SessionPayload> {
  const session = await verifySession();

  if (!canAccessPath(session.role, pathname)) {
    redirect(ROLE_HOME[session.role]);
  }

  return session;
}

/**
 * Branch scoping for BRANCH_MANAGER. Roles with company-wide read get `null`
 * (no filter); a branch-scoped role gets its own `branchId`.
 */
export async function getBranchScope(): Promise<number | null> {
  const session = await verifySession();

  if (hasPermission(session.role, "branch:read")) {
    return null;
  }

  return session.branchId;
}
