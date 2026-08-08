import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

/** Display formatting. Never used for computation — the payroll engine owns that. */

const DATE_INPUT = "yyyy-MM-dd";

function safeParse(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/** "12 Aug 2026" */
export function formatDate(value: string | null | undefined): string {
  const date = safeParse(value);
  return date ? format(date, "dd MMM yyyy") : "—";
}

/** "12 Aug 2026, 14:30" */
export function formatDateTime(value: string | null | undefined): string {
  const date = safeParse(value);
  return date ? format(date, "dd MMM yyyy, HH:mm") : "—";
}

/** "14:30" — for clock-in/out columns. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = safeParse(value);
  if (date) return format(date, "HH:mm");
  // Bare TIME column, e.g. "08:00:00"
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : "—";
}

/**
 * "12 minutes ago" — freshness, not a timestamp.
 *
 * Only for liveness signals where "how stale is this" is the whole point: a
 * device heartbeat, a sync cursor. Anything that has to reconcile later — an
 * audit row, a clock-in, a payslip date — uses `formatDateTime`, because this
 * output changes on every render and cannot be read back.
 */
export function formatRelativeTime(value: string | null | undefined): string {
  const date = safeParse(value);
  return date ? formatDistanceToNowStrict(date, { addSuffix: true }) : "—";
}

/** Value for an <input type="date">. */
export function toDateInput(value: string | null | undefined): string {
  const date = safeParse(value);
  return date ? format(date, DATE_INPUT) : "";
}

/** "1 Aug – 31 Aug 2026" — payroll period display. */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  const from = safeParse(start);
  const to = safeParse(end);
  if (!from || !to) return "—";

  const sameYear = from.getFullYear() === to.getFullYear();
  const left = format(from, sameYear ? "d MMM" : "d MMM yyyy");
  return `${left} – ${format(to, "d MMM yyyy")}`;
}

/**
 * "KES 125,000.00". Defaults to KES to match `companies.currency`; pass the
 * company's configured currency where one is available.
 */
export function formatMoney(
  amount: number | null | undefined,
  currency = "KES",
): string {
  if (amount === null || amount === undefined) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** "125,000" — compact form for KPI tiles. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-KE").format(value);
}

/**
 * "KES 18.4M" — dashboard tiles, where the exact shilling is noise and the
 * column is too narrow for the full figure.
 *
 * Never use this on a payslip, invoice or disbursement total: those must
 * reconcile against the backend to the cent. Use `formatMoney` there.
 */
export function formatMoneyCompact(
  amount: number | null | undefined,
  { currency = "KES", showCurrency = true }: {
    currency?: string;
    showCurrency?: boolean;
  } = {},
): string {
  if (amount === null || amount === undefined) return "—";

  const compact = new Intl.NumberFormat("en-KE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);

  return showCurrency ? `${currency} ${compact}` : compact;
}

/** "16%" — VAT rate from company_settings. */
export function formatPercent(
  value: number | null | undefined,
  fractionDigits = 0,
): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(fractionDigits)}%`;
}

/** "DK" — avatar fallback. */
export function initials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** "PENDING_HR" → "Pending HR" */
export function humanizeEnum(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .split("_")
    .map((word) =>
      word === "HR" || word === "VAT" || word === "PAYE"
        ? word
        : word.charAt(0) + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

/** Hours worked between clock-in and clock-out, e.g. "8h 15m". */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}
