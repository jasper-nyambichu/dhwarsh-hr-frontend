import Link from "next/link";

import { requirePermission } from "@/app/lib/dal";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";

/**
 * A leave request by id — which the API cannot serve.
 *
 * `LeaveController` exposes leave by *scope*: the HR queue (`/pending/hr`), the
 * manager queue (`/pending/manager`), one employee's history
 * (`/employee/{id}`), and the caller's own balance. There is no `GET /leave`
 * and no `GET /leave/{id}`, so a route that takes an arbitrary request id has
 * nothing to read.
 *
 * This page says so rather than being deleted or filled with invented data. The
 * two real ways to find a request are linked below, and the decision itself is
 * made inline on the queue — this screen was never on the path to approving
 * anything.
 */
export default async function LeaveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("leave:read");

  const { id } = await params;

  return (
    <>
      <PageHeader
        title={`Leave Request #${id}`}
        description="Not available from this API."
      />

      <div className="rounded-card border border-dashed border-outline-variant bg-surface-container-lowest p-8">
        <div className="flex items-start gap-4">
          <Icon
            name="info"
            className="mt-0.5 text-[28px] text-on-surface-variant"
          />
          <div className="max-w-xl">
            <p className="font-body-md text-body-md font-semibold text-on-surface">
              There is no endpoint that returns a single leave request.
            </p>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              The backend exposes leave by scope — the HR approval queue, one
              employee&rsquo;s history — and never by request id. Putting a
              placeholder here would mean showing invented dates and statuses for
              a real request, which is worse than showing nothing.
            </p>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Decisions are made inline on the queue, so nothing in the product
              links to this page.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/hr/leave" className={buttonVariants()}>
                <Icon name="pending_actions" className="text-[18px]" />
                Back to the approval queue
              </Link>
              <Link
                href="/hr/employees"
                className={buttonVariants({ variant: "secondary" })}
              >
                Find the employee
              </Link>
            </div>

            <p className="mt-6 text-[11px] text-outline">
              An employee&rsquo;s full leave history is available on their record
              page, via <code>GET /leave/employee/&#123;id&#125;</code>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
