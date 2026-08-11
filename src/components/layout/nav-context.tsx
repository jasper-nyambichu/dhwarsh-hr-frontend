"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Navigation shell state — two independent axes, deliberately not merged.
 *
 * `open` is the mobile drawer. The rail is off-canvas below `md`, so this is
 * a transient overlay: it always starts closed, closes on route change, and is
 * never persisted. The hamburger that drives it lives in the top bar rather
 * than inside the rail, which is why the state is lifted here.
 *
 * `expanded` is the desktop width. The rail is always visible from `md` up and
 * toggles between a 96px icon rail and a 264px labelled sidebar that pushes the
 * content column rather than covering it. This one IS persisted, because a
 * width preference that resets on every navigation is worse than no toggle.
 *
 * Persistence is a plain `document.cookie` write, not a Server Action. The
 * layout is a Server Component that reads the cookie to pick the first paint,
 * so a client-only write keeps the toggle instant while still surviving reload
 * with no flash of the wrong width. It is a UI preference, so it is
 * deliberately not httpOnly — nothing here is a security boundary.
 */

export const SIDEBAR_COOKIE = "sidebar_expanded";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type NavState = {
  /** Mobile drawer. */
  open: boolean;
  toggle: () => void;
  close: () => void;
  /** Desktop sidebar width. */
  expanded: boolean;
  toggleExpanded: () => void;
};

const NavContext = createContext<NavState | null>(null);

export function NavProvider({
  children,
  defaultExpanded = false,
}: {
  children: ReactNode;
  /** Read from the cookie on the server so the first paint is already correct. */
  defaultExpanded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  const toggleExpanded = useCallback(() => {
    setExpanded((v) => {
      const next = !v;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
      return next;
    });
  }, []);

  // Escape closes the drawer — expected of anything overlaying the page, and
  // the only exit for a keyboard user who never reaches the scrim.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Lock the page behind the drawer. Without this the body scrolls under the
  // scrim on iOS and the user loses their place in the list they came from.
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const value = useMemo<NavState>(
    () => ({ open, toggle, close, expanded, toggleExpanded }),
    [open, toggle, close, expanded, toggleExpanded],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavState {
  const context = useContext(NavContext);

  if (!context) {
    throw new Error("useNav must be used inside <NavProvider>.");
  }

  return context;
}
