import Link from "next/link";

import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * "Awaiting Approval" queue — a compact list of pending items with the
 * requester, a type chip and a one-line summary.
 *
 * Avatars are initials, not photos: `employees.passport_photo_url` is
 * nullable, and a dashboard tile is the wrong place to fan out image requests.
 */

export type ApprovalTone = "leave" | "loan" | "advance" | "overtime" | "expense";

export type ApprovalItem = {
  id: string | number;
  requester: string;
  summary: string;
  /** Chip label, e.g. "Leave". */
  type: string;
  tone: ApprovalTone;
  href: string;
};

const TONE_CLASS: Record<ApprovalTone, string> = {
  leave: "text-amber-main bg-amber-main/10",
  loan: "text-blue bg-blue/10",
  advance: "text-blue bg-blue/10",
  overtime: "text-error bg-error/10",
  expense: "text-green-main bg-green-main/10",
};

export function ApprovalList({ items }: { items: readonly ApprovalItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-[11px] text-outline">
        Nothing awaiting your approval.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={`${item.tone}-${item.id}`}>
          <Link
            href={item.href}
            className="group -mx-2 flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface-container"
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-[10px] font-bold text-on-surface-variant"
            >
              {initials(item.requester)}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2">
                <span className="truncate text-[11px] font-semibold text-on-surface group-hover:text-primary-container">
                  {item.requester}
                </span>
                <span
                  className={cn(
                    "ml-2 shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px]",
                    TONE_CLASS[item.tone],
                  )}
                >
                  {item.type}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-on-surface-variant">
                {item.summary}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
