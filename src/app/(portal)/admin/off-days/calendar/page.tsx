import Link from "next/link";

import { ApiError } from "@/app/lib/api-error";
import { requirePermission } from "@/app/lib/dal";
import { MonthNav, OffDayCalendar } from "@/components/features/off-days/off-day-calendar";
import { DataUnavailable } from "@/components/shared/data-unavailable";
import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";
import { getOffDays } from "@/lib/api/off-day";
import { monthRange, parseMonth } from "@/lib/off-days";
import { buildHref, first } from "@/lib/search-params";

/** Dashboard → Off Days: the whole month, showing which employees were given which days off. */
export default async function AdminOffDayCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("offday:read");

  const month = parseMonth(first((await searchParams).month));

  let offDays: Awaited<ReturnType<typeof getOffDays>>;
  try {
    offDays = await getOffDays(monthRange(month));
  } catch (error) {
    return <DataUnavailable title="Off Days Calendar" subject="The off days" reason={error instanceof ApiError ? error.message : undefined} />;
  }

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              aria-label="Back to dashboard"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <Icon name="arrow_back" />
            </Link>
            Off Days Calendar
          </span>
        }
        actions={<MonthNav month={month} hrefFor={(target) => buildHref("/admin/off-days/calendar", { month: target })} />}
      />
      <OffDayCalendar month={month} offDays={offDays} />
    </>
  );
}
