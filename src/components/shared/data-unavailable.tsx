import { logout } from "@/app/actions/auth";
import { PageHeader } from "@/components/shared/page-header";
import { RetryButton } from "@/components/shared/retry-button";
import { Icon } from "@/components/ui/icon";
import { NO_PERMISSION, SESSION_EXPIRED, SYSTEM_ERROR } from "@/lib/api-messages";

/**
 * Shown when a portal page cannot load its data.
 *
 * This exists because of a specific failure mode: the screen that renders
 * zeros is indistinguishable from the screen that renders zeros because
 * nothing happened. An administrator looking at an attendance board showing
 * "0 present" cannot tell whether the system is down or nobody came to work,
 * and those two readings call for opposite actions.
 *
 * So a failed read renders this instead of an empty table — the page refuses
 * to imply a fact it could not establish. The header is kept so the route is
 * still identifiable, but its metric slots are left empty rather than zeroed.
 *
 * It tells the user what happened and offers the one next step that can help.
 * The technical cause goes to the server log (see `toApiError`), never here.
 */
export function DataUnavailable({
  title,
  description,
  subject,
  reason = SYSTEM_ERROR,
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
  /** Why, in words meant for the user. `ApiError.message` already is. */
  reason?: string;
}) {
  const sessionEnded = reason === SESSION_EXPIRED;
  const refused = reason === NO_PERMISSION;

  return (
    <>
      <PageHeader title={title} description={description} />

      <div role="alert" className="rounded-card border border-dashed border-error/40 bg-error/5 p-8 text-center">
        <Icon name={sessionEnded ? "lock" : refused ? "block" : "cloud_off"} className="text-[40px] text-error" />
        <p className="mt-3 font-body-md text-body-md font-semibold text-on-surface">
          {subject} could not be loaded
        </p>
        <p className="mx-auto mt-1 max-w-md font-body-md text-body-md text-on-surface-variant">
          {reason}
        </p>

        {sessionEnded ? (
          <form action={logout} className="mt-4">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              Sign in again
            </button>
          </form>
        ) : refused ? (
          <p className="mx-auto mt-3 max-w-md text-xs text-on-surface-variant">
            If you think you should have access, contact your administrator.
          </p>
        ) : (
          <>
            <div className="mt-4">
              <RetryButton />
            </div>
            <p className="mx-auto mt-3 max-w-md text-xs text-on-surface-variant">
              If this keeps happening, contact your administrator.
            </p>
          </>
        )}
      </div>
    </>
  );
}
