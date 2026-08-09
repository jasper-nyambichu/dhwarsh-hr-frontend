import "server-only";

/**
 * Error envelope parsing. Mirrors `exception/GlobalExceptionHandler`.
 *
 * Parsed in one place so no call site has to guess the response shape.
 */

/** Shape emitted by the Spring GlobalExceptionHandler (`ApiResponse.error`). */
export type ApiErrorBody = {
  success?: boolean;
  message?: string;
  timestamp?: string;
  /**
   * `@Valid` failures land here — the handler puts the field→message map in
   * the envelope's `data` slot rather than a dedicated `errors` key.
   */
  data?: Record<string, string | string[]> | null;
  /** Spring Boot's own error page shape, for anything short of a controller. */
  status?: number;
  error?: string;
  path?: string;
  errors?: Record<string, string | string[]>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;
  readonly path?: string;

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string[]>,
    path?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.path = path;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidation(): boolean {
    return this.status === 400 || this.status === 422;
  }

  /** 409 — optimistic-lock or duplicate-key collision. */
  get isConflict(): boolean {
    return this.status === 409;
  }

  get isServer(): boolean {
    return this.status >= 500;
  }
}

function normalizeFieldErrors(
  errors: Record<string, string | string[]> | null | undefined,
): Record<string, string[]> | undefined {
  if (!errors) return undefined;

  const entries = Object.entries(errors).filter(
    ([, value]) =>
      typeof value === "string" ||
      (Array.isArray(value) && value.every((v) => typeof v === "string")),
  );

  if (entries.length === 0) return undefined;

  return Object.fromEntries(
    entries.map(([field, value]) => [
      field,
      Array.isArray(value) ? value : [value],
    ]),
  );
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: "The request was invalid.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested record was not found.",
  409: "This record was changed by someone else. Reload and try again.",
  422: "Some fields need attention.",
  500: "Something went wrong on the server.",
  503: "The service is temporarily unavailable.",
};

/** Builds an ApiError from a failed Response. Never throws. */
export async function toApiError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | undefined;

  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // Empty or non-JSON body (gateway timeout, HTML error page).
  }

  const message =
    body?.message?.trim() ||
    body?.error?.trim() ||
    FALLBACK_MESSAGES[response.status] ||
    `Request failed with status ${response.status}.`;

  return new ApiError(
    response.status,
    message,
    normalizeFieldErrors(asFieldMap(body?.data) ?? body?.errors),
    body?.path,
  );
}

/**
 * `data` is the envelope's generic payload slot, so on a validation failure it
 * holds the field→message map but on any other error it is null — or, for a
 * hand-rolled error response, could be anything at all. Only a plain object
 * survives; a string would otherwise index into per-character "fields".
 */
function asFieldMap(
  data: unknown,
): Record<string, string | string[]> | undefined {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return undefined;
  }

  return data as Record<string, string | string[]>;
}

/**
 * Converts any thrown value into an `ActionState` error for `useActionState`.
 * Keeps raw internals out of the UI.
 */
export function toActionError(error: unknown): {
  status: "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
} {
  if (error instanceof ApiError) {
    return {
      status: "error",
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }

  return {
    status: "error",
    message: "Unable to reach the server. Check your connection and try again.",
  };
}
