"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Open/closed state for the mobile navigation rail.
 *
 * The rail and the button that opens it live in different components (the
 * Stitch markup puts the hamburger at the far left of the top bar, not inside
 * the rail), so the state is lifted here rather than owned by either one.
 *
 * Desktop ignores this entirely — the rail is `md:relative` and always shown.
 */

type NavState = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const NavContext = createContext<NavState | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo<NavState>(
    () => ({ open, toggle, close }),
    [open, toggle, close],
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
