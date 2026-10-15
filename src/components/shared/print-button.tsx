"use client";

import { Icon } from "@/components/ui/icon";

/** Opens the browser's print dialog — the payslip view is laid out for it. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg bg-secondary-container px-4 py-2 text-sm font-medium text-on-secondary-container shadow-[0_2px_8px_rgba(11,42,69,.06)] transition-transform hover:-translate-y-0.5 print:hidden"
    >
      <Icon name="print" className="text-sm" />
      Print
    </button>
  );
}