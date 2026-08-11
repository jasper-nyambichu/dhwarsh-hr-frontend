import "server-only";

/**
 * Validated access to server-side environment variables.
 *
 * Per the Next.js data-security guide, only the data-access layer should read
 * `process.env`. Everything else imports from here, so a missing variable
 * fails loudly the moment it's used — not at module-import time, which would
 * crash `next build`'s page-data collection for any page that transitively
 * imports this file, even pages that never render at build time.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.local.`,
    );
  }
  return value;
}

export const env = {
  /** Base URL of the Spring Boot HR/payroll API. Server-side only. */
  get API_BASE_URL(): string {
    return required("API_BASE_URL", process.env.API_BASE_URL);
  },
  /** HS256 secret for the session cookie. `openssl rand -base64 32` */
  get SESSION_SECRET(): string {
    return required("SESSION_SECRET", process.env.SESSION_SECRET);
  },
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;

export const isProduction = env.NODE_ENV === "production";