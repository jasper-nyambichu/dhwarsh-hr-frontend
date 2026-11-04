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

/**
 * Lazily derives and caches the signing key on first use, rather than at
 * module scope. Reading `env.SESSION_SECRET` eagerly at import time would
 * throw the moment anything imports this module — including `next build`
 * collecting page data — before a request context ever exists.
 */
let cachedKey: Uint8Array | undefined;
function getEncodedKey(): Uint8Array {
  if (!cachedKey) {
    cachedKey = new TextEncoder().encode(env.SESSION_SECRET);
  }
  return cachedKey;
}

export type SessionPayload = {
  userId: number;
  username: string;
  displayName: string;
  role: Role;
  employeeId: number | null;
  agentId: number | null;
  branchId: number | null;
  mustChangePassword: boolean;
  /** Null without a profile photo. Changes when the photo does, so browsers fetch the new one. */
  photoVersion?: number | null;
  /** Backend JWT. Server-side only — never send to a Client Component. */
  accessToken: string;
  /**
   * Longer-lived backend token, exchanged for a fresh access token when the
   * access token expires mid-session. Same server-only rule as above.
   */
  refreshToken: string;
  expiresAt: string;
};

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getEncodedKey());
}

export async function decrypt(
  session: string | undefined = "",
): Promise<SessionPayload | undefined> {
  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ["HS256"],
    });

    // Trust nothing that comes back out of the cookie without re-checking.
    if (
      typeof payload.userId !== "number" ||
      typeof payload.username !== "string" ||
      typeof payload.accessToken !== "string" ||
      typeof payload.refreshToken !== "string" ||
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

/**
 * Trades the refresh token for a fresh pair via `POST /auth/refresh`.
 *
 * The backend access token lives 15 minutes while this cookie lives 8 hours,
 * so without this every session would start failing a quarter-hour in.
 * Returns the new access token, or undefined if the refresh token is itself
 * spent — the caller should then treat the session as ended.
 *
 * Deliberately uses raw `fetch` rather than `api` to avoid an import cycle:
 * api-client depends on this module for the token it attaches.
 */
export async function refreshSession(
  session: SessionPayload,
): Promise<string | undefined> {
  let payload: { data?: RefreshedTokens } | undefined;

  try {
    const response = await fetch(
      `${env.API_BASE_URL.replace(/\/$/, "")}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
        cache: "no-store",
      },
    );

    if (!response.ok) return undefined;

    payload = (await response.json()) as { data?: RefreshedTokens };
  } catch {
    return undefined;
  }

  const tokens = payload?.data;

  if (
    typeof tokens?.accessToken !== "string" ||
    typeof tokens?.refreshToken !== "string"
  ) {
    return undefined;
  }

  try {
    await createSession({ ...session, ...tokens });
  } catch {
    // Server Components render with a read-only cookie store, so persisting
    // fails there. The caller still gets the fresh token for this request;
    // the next Server Action or Route Handler re-persists it.
  }

  return tokens.accessToken;
}

type RefreshedTokens = { accessToken: string; refreshToken: string };

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };