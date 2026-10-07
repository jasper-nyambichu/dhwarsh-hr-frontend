import { PageHeader } from "@/components/shared/page-header";
import { Icon } from "@/components/ui/icon";

/**
 * Shown when a portal page cannot reach the API at all.
 *
 * This exists because of a specific failure mode: the screen that renders
 * zeros is indistinguishable from the screen that renders zeros because
 * nothing happened. An administrator looking at an attendance board showing
 * "0 present" cannot tell whether the backend is down or nobody came to work,
 * and those two readings call for opposite actions.
 *
 * So a failed read renders this instead of an empty table — the page refuses
 * to imply a fact it could not establish. The header is kept so the route is
 * still identifiable, but its metric slots are left empty rather than zeroed.
 *
 * Long-form `reason` is for the underlying error text. The last line is the
 * first-run case: `API_BASE_URL` in `.env.local` pointing at a backend that
 * is not running is the most common cause by a wide margin.
 */
export function DataUnavailable({
  title,
  description,
  subject,
  reason,
}: {
  /** Page title, matching the header the page renders on success. */
  title: string;
  /** Page description, matching the header the page renders on success. */
  description?: string;
  /**
   * What could not be loaded, in the reader's terms — "Branches", "the
   * payroll run list". Used inside the sentence, so keep it a noun phrase.
   */
  subject: string;
  /** The underlying error message. */
  reason?: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />

      <div className="rounded-card border border-dashed border-error/40 bg-error/5 p-8 text-center">
        <Icon name="cloud_off" className="text-[40px] text-error" />
        <p className="mt-3 font-body-md text-body-md font-semibold text-on-surface">
          {subject} could not be loaded
        </p>
        {reason ? (
          <p className="mx-auto mt-1 max-w-md font-body-md text-body-md text-on-surface-variant">
            {reason}
          </p>
        ) : null}
        <p className="mx-auto mt-3 max-w-md text-[11px] text-outline">
          Check that the backend is running and that <code>API_BASE_URL</code> in{" "}
          <code>.env.local</code> matches the port it listens on.
        </p>
      </div>
    </>
  );
}
