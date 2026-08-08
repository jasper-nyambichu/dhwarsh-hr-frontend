import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { env } from "@/config/env";
import { isRole, type Role } from "@/config/roles";

/**
 * Session management. Mirrors `security/JwtService`.
 *
 * The Spring API issues its own JWT. We wrap it in a second, httpOnly cookie
 * signed with SESSION_SECRET so the backend token never reaches the browser —
 * no localStorage, nothing readable from JS. `apiFetch` unwraps it server-side
 * and attaches it as `Authorization: Bearer`.
 */

const SESSION_COOKIE = "dhwarsh_session";
const encodedKey = new TextEncoder().encode(env.SESSION_SECRET);

export type SessionPayload = {
  userId: number;
  username: string;
  role: Role;
  employeeId: number | null;
  agentId: number | null;
  branchId: number | null;
  mustChangePassword: boolean;
  /** Backend JWT. Server-side only — never send to a Client Component. */
  accessToken: string;
  expiresAt: string;
};

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(encodedKey);
}

export async function decrypt(
  session: string | undefined = "",
): Promise<SessionPayload | undefined> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });

    // Trust nothing that comes back out of the cookie without re-checking.
    if (
      typeof payload.userId !== "number" ||
      typeof payload.username !== "string" ||
      typeof payload.accessToken !== "string" ||
      !isRole(payload.role)
    ) {
      return undefined;
    }

    return payload as unknown as SessionPayload;
  } catch {
    // Expired or tampered — treat as signed out.
    return undefined;
  }
}

export async function createSession(
  payload: Omit<SessionPayload, "expiresAt">,
): Promise<void> {
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const session = await encrypt({ ...payload, expiresAt: expiresAt.toISOString() });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | undefined> {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
