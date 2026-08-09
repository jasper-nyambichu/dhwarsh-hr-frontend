/**
 * Dev smoke-test helper: logs in against the real backend and prints a session
 * cookie identical to the one `createSession` writes.
 *
 * Exists so the wired routes can be exercised over plain HTTP without driving
 * React's Server Action protocol by hand. Not imported by the app.
 *
 *   node --experimental-strip-types scripts/mint-session.ts <username> <password>
 */
import { SignJWT } from "jose";
import { readFileSync } from "node:fs";

function envValue(key: string): string {
  const file = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const match = new RegExp(`^${key}="?([^"\\n]*)"?$`, "m").exec(file);
  if (!match) throw new Error(`${key} missing from .env.local`);
  return match[1];
}

const API_BASE_URL = envValue("API_BASE_URL").replace(/\/$/, "");
const SESSION_SECRET = envValue("SESSION_SECRET");

async function main() {
  const [username = "admin", password = "Admin@12345"] = process.argv.slice(2);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const envelope = await response.json();

  if (!response.ok || !envelope.success) {
    console.error(`Login failed (${response.status}):`, envelope.message);
    process.exit(1);
  }

  const auth = envelope.data;
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  const cookie = await new SignJWT({
    userId: auth.userId,
    username: auth.username,
    displayName: auth.displayName ?? auth.username,
    role: auth.role,
    employeeId: auth.employeeId,
    agentId: auth.agentId,
    branchId: auth.branchId,
    mustChangePassword: auth.mustChangePassword,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    expiresAt: expiresAt.toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(new TextEncoder().encode(SESSION_SECRET));

  console.log(cookie);
}

main();
