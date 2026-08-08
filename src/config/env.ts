import "server-only";

/**
 * Validated access to server-side environment variables.
 *
 * Per the Next.js data-security guide, only the data-access layer should read
 * `process.env`. Everything else imports from here, so a missing variable
 * fails loudly at boot instead of surfacing as `undefined` inside a fetch.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value;
}

export const env = {
  /** Base URL of the Spring Boot HR/payroll API. Server-side only. */
  API_BASE_URL: required("API_BASE_URL", process.env.API_BASE_URL),
  /** HS256 secret for the session cookie. `openssl rand -base64 32` */
  SESSION_SECRET: required("SESSION_SECRET", process.env.SESSION_SECRET),
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;

export const isProduction = env.NODE_ENV === "production";
