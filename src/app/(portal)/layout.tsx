import { AppRail } from "@/components/layout/app-rail";
import { NavProvider } from "@/components/layout/nav-context";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/app/lib/dal";

/**
 * Protected shell for all 9 role portals.
 *
 * `getCurrentUser()` calls `verifySession()`, which redirects to /login when
 * there is no valid session and to /set-password when
 * `users.must_change_password` is set. This is the real gate — `proxy.ts` is
 * only an optimistic pre-filter.
 *
 * The rail is built from the session role, so a user never sees navigation for
 * a namespace they cannot enter.
 *
 * Layout: the outer padded frame plus the inset rounded card is the Stitch
 * "software within a window" treatment — the app floats on the page background
 * rather than bleeding to the viewport edge. Padding collapses to zero below
 * md so small screens get the full width.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <NavProvider>
      <div className="flex h-dvh w-full overflow-hidden bg-background p-0 md:p-6 lg:p-8">
        <div className="relative flex h-full w-full flex-1 overflow-hidden rounded-none border border-outline-variant/20 bg-surface-container-lowest shadow-shell md:rounded-[20px]">
          <AppRail role={user.role} />

          <main className="relative z-0 flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-surface-bright">
            <Topbar user={user} />

            <div className="no-scrollbar flex-1 overflow-y-auto px-container-margin pb-container-margin pt-4">
              <div className="mx-auto w-full max-w-[1600px]">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </NavProvider>
  );
}
