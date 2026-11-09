import { NextResponse, type NextRequest } from "next/server";

import { ROLE_HOME, canAccessPath } from "@/config/roles";

import { decrypt } from "@/app/lib/session";

/**
 * Request proxy. In Next.js 16 this file replaces `middleware.ts` —
 * the convention was renamed and the export must be `proxy`.
 *
 * OPTIMISTIC gate only: keeps users out of the wrong namespace and off login
 * screens when already signed in. Trivially bypassable, so every page
 * re-checks through the DAL and every Server Action re-authorizes on its own.
 * Server Functions POST to the route they live on, so a matcher change here
 * can silently drop coverage — never rely on this alone.
 */

/** Reachable without a session — one per principal type, plus recovery. */
const PUBLIC_PATHS = [
  "/login",
  "/branch/login",
  "/agent/login",
  "/forgot-password",
  "/reset-password",
];

/** Reachable while `must_change_password` is set, and nothing else. */
const PASSWORD_ROTATION_PATH = "/set-password";

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Biometric terminals authenticate by device token, not a user session.
  if (pathname.startsWith("/kiosk")) {
    return NextResponse.next();
  }

  const session = await decrypt(request.cookies.get("dhwarsh_session")?.value);

  if (!session) {
    if (isPublic(pathname)) {
      return NextResponse.next();
    }

    // Each portal's own login page. The main login is the default door.
    const door = pathname.startsWith("/branch") ? "/branch/login" : pathname.startsWith("/agent") ? "/agent/login" : "/login";
    const loginUrl = new URL(door, request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const home = ROLE_HOME[session.role];

  // Pin a flagged session to the rotation screen until it completes.
  if (session.mustChangePassword) {
    return pathname === PASSWORD_ROTATION_PATH
      ? NextResponse.next()
      : NextResponse.redirect(new URL(PASSWORD_ROTATION_PATH, request.url));
  }

  // Already signed in — no reason to sit on a login screen.
  if (isPublic(pathname) || pathname === "/" || pathname === PASSWORD_ROTATION_PATH) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (pathname === "/legal" || pathname.startsWith("/legal/")) {
    return NextResponse.next();
  }

  // Wrong namespace: an AGENT poking at /admin lands back home.
  if (!canAccessPath(session.role, pathname)) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excludes static assets, image optimization and public files, so auth
  // redirects never swallow CSS, JS or images.
  // `icon` and `apple-icon` are the generated tab icons (app/icon.tsx): they have no file extension, so without
  // them here a signed-in browser asking for its tab icon was redirected to, and rendered, the whole dashboard.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
