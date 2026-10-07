import Link from "next/link";

import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Previous / "Page N of M" / Next row for a paginated table.
 *
 * The controls are links rather than buttons on purpose: the page number
 * belongs in the URL alongside the other filters, so a page is shareable,
 * bookmarkable and survives a refresh. That means pagination has to be
 * rendered from a Server Component, which is why this takes `hrefFor` instead
 * of an `onPageChange` callback.
 *
 * Renders nothing when there is a single page — a lone "Page 1 of 1" is noise.
 *
 * `pageNumber` is the zero-based index the API returns; the label is
 * one-based because that is what a reader expects.
 */
export function Pagination<T>({
  data,
  hrefFor,
  className,
}: {
  data: {
    pageNumber: number;
    totalPages: number;
    last: boolean;
  };
  /** Builds the URL for a zero-based page index. */
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (data.totalPages <= 1) return null;

  const hasPrevious = data.pageNumber > 0;
  const hasNext = !data.last;

  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-between border-t border-outline-variant/40 pt-4 text-[11px] text-on-surface-variant",
        className,
      )}
    >
      <span>
        Page {formatNumber(data.pageNumber + 1)} of {formatNumber(data.totalPages)}
      </span>

      <div className="flex items-center gap-1">
        {hasPrevious ? (
          <Link
            href={hrefFor(data.pageNumber - 1)}
            rel="prev"
            className="rounded-md px-2.5 py-1 transition-colors hover:bg-surface-container-low"
          >
            Previous
          </Link>
        ) : null}

        {hasNext ? (
          <Link
            href={hrefFor(data.pageNumber + 1)}
            rel="next"
            className="rounded-md px-2.5 py-1 transition-colors hover:bg-surface-container-low"
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
