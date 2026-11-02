import { cookies } from "next/headers";

import { AppRail } from "@/components/layout/app-rail";
import { NavProvider, SIDEBAR_COOKIE } from "@/components/layout/nav-context";
import { StubActionBridge } from "@/components/layout/stub-action-bridge";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/app/lib/dal";
import { getMe } from "@/lib/api/user";

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
 * Layout: full-bleed. The shell owns the whole viewport — the rail and the
 * content column are the only two children of a single flex row, so expanding
 * the rail pushes the content instead of covering it. `min-w-0` on the content
 * column is load-bearing: without it a wide table sets the flex item's minimum
 * size and the rail animation shoves the page sideways instead of reflowing it.
 *
 * `max-w-content` caps the reading column on ultrawide displays. Full-bleed
 * means the chrome reaches the edges; it does not mean a 3440px line length.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);

  // Picked on the server so the first paint is already the right width — a
  // client-side read would flash the collapsed rail on every navigation.
  const expanded = cookieStore.get(SIDEBAR_COOKIE)?.value === "1";

  // A convenience only: the page and the backend are what enforce it, so a failed read just hides the link.
  const canRunPayments = user.role === "BRANCH_MANAGER" ? await getMe().then((me) => me.canRunPayments).catch(() => false) : false;

  return (
    <NavProvider defaultExpanded={expanded}>
      <StubActionBridge />
      <div className="flex h-dvh w-full overflow-hidden bg-surface-bright">
        {/* Chrome is interactive by construction — exempt from the stub net. */}
        <div data-live-region className="contents">
          <AppRail role={user.role} canRunPayments={canRunPayments} />
        </div>

        <main className="relative z-0 flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar user={user} />

          <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-6 lg:px-container-margin">
            <div className="mx-auto w-full max-w-content">{children}</div>
          </div>
        </main>
      </div>
    </NavProvider>
  );
}
