/**
 * Server-side search-param helpers for portal pages.
 *
 * `searchParams` is a Promise in Next.js 16 and every value arrives as
 * `string | string[] | undefined`. These lift the parsing each list page
 * would otherwise repeat verbatim — the originals were private helpers in
 * `app/(portal)/admin/attendance/page.tsx`.
 *
 * Parsing is deliberately strict: anything that is not a well-formed value is
 * treated as absent rather than coerced, because a bad `branchId` silently
 * becoming `NaN` produces an empty table that looks like a data problem.
 */

/** Collapses Next's `string | string[] | undefined` to a single value. */
export function first(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** A positive integer id, or `undefined` if absent/malformed. */
export function parseId(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/** `yyyy-MM-dd` only. Parametric date filters reject anything else with a 400. */
export function parseDate(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

/** Zero-based page index. The API is 0-based; the UI shows `pageNumber + 1`. */
export function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

/** Page size, clamped to what the backend will accept. */
export function parseSize(
  value: string | undefined,
  fallback: number,
  max = 100,
): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

/** A free-text query, trimmed, with empty strings read as absent. */
export function parseQuery(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Rebuilds a URL for one of `basePath`'s pages, preserving the active
 * filters and dropping the ones that are unset.
 *
 * Page 0 is omitted so the canonical list URL stays clean.
 */
export function buildHref(
  basePath: string,
  params: Record<string, string | number | undefined>,
  page?: number,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }

  if (page !== undefined && page > 0) search.set("page", String(page));

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}
