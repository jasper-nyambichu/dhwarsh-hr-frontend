/** KES with thousands separators, e.g. "KES 1,500.00". Display only; the backend is authoritative. */
export function formatKes(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `KES ${formatted}`;
}