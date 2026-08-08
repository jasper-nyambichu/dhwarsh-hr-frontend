import "server-only";

import { env } from "@/config/env";
import type { Paginated } from "@/types";

import { ApiError, toApiError } from "./api-error";
import { getSession } from "./session";

/**
 * Server-side fetch wrapper for the Spring Boot API.
 * Mirrors the `controller/` surface; one function per HTTP verb.
 *
 * Never import this from a Client Component — it reads the session cookie and
 * carries the backend JWT. Client data flows through Server Components or
 * Server Actions instead.
 */

type QueryValue = string | number | boolean | null | undefined;

export type ApiRequestOptions = {
  query?: Record<string, QueryValue | QueryValue[]>;
  /** Next.js cache tags, for `revalidateTag` after a mutation. */
  tags?: string[];
  /** Seconds. Omit for no-store (default on authenticated reads). */
  revalidate?: number | false;
  signal?: AbortSignal;
  /** Skip the Authorization header (login, password reset). */
  anonymous?: boolean;
};

function buildUrl(
  path: string,
  query?: ApiRequestOptions["query"],
): string {
  const base = env.API_BASE_URL.replace(/\/$/, "");
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;

      if (Array.isArray(value)) {
        for (const entry of value) {
          if (entry !== undefined && entry !== null && entry !== "") {
            url.searchParams.append(key, String(entry));
          }
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  const isFormData = body instanceof FormData;

  if (body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.anonymous) {
    const session = await getSession();

    if (!session) {
      throw new ApiError(401, "Your session has expired. Please sign in again.");
    }

    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      signal: options.signal,
      // Authenticated reads are per-user; caching them across users would leak.
      cache: options.revalidate === undefined ? "no-store" : undefined,
      next:
        options.revalidate === undefined
          ? undefined
          : { revalidate: options.revalidate, tags: options.tags },
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") throw cause;
    throw new ApiError(503, "Unable to reach the server.");
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>("GET", path, undefined, options),

  /** Convenience wrapper for endpoints returning Spring `Page<T>`. */
  getPage: <T>(path: string, options?: ApiRequestOptions) =>
    request<Paginated<T>>("GET", path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>("POST", path, body, options),

  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>("PUT", path, body, options),

  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>("PATCH", path, body, options),

  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};

/** Streams a PDF from `service/payroll/documents` for download. */
export async function fetchDocument(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ blob: Blob; filename: string }> {
  const session = await getSession();

  if (!session) {
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  const response = await fetch(buildUrl(path, options.query), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/pdf",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="?([^"]+)"?/.exec(disposition);

  return {
    blob: await response.blob(),
    filename: match?.[1] ?? "document.pdf",
  };
}
