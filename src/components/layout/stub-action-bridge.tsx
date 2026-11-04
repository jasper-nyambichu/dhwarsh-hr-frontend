"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { toast } from "@/lib/toast";

/**
 * Transitional scaffold: makes unwired controls admit that they are unwired.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * Most screens in this app still render placeholder data. That left ~270
 * buttons and `href="#"` links that look live, are clicked, and do nothing —
 * which users read as "the product is broken", not "this part isn't built".
 *
 * Rather than hand-editing every one of those call sites (and getting some
 * wrong), a single delegated listener reports any click that no real handler
 * claimed.
 *
 * THE CONTRACT — read this before adding a working button
 *
 * A control is treated as LIVE, and left alone, when any of these hold:
 *   • it (or an ancestor) has `data-live`  ← <Button> sets this for you
 *   • it is a submit/reset button, or sits inside a <form>
 *   • it is an <a> with a real href (not "#", not empty)
 *   • it is inside [data-live-region] — use this to exempt a whole subtree
 *
 * So: build interactive controls with <Button>/<SubmitButton> from
 * `components/ui/button` and this never fires for them. If you hand-roll a
 * <button onClick={...}>, add `data-live` yourself.
 *
 * DELETE THIS once the screens are wired. It is scaffolding, not architecture —
 * its whole job is to be unnecessary.
 * ─────────────────────────────────────────────────────────────────────────
 */
export function StubActionBridge() {
  const pathname = usePathname();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Let modified clicks through — the user is opening a tab, not acting.
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const target = event.target as Element | null;
      const control = target?.closest?.("button, a, [role='button']");
      if (!(control instanceof HTMLElement)) return;

      // Its own click removed it from the page (a calendar day closing the calendar), so something
      // handled that click. Once detached it has also lost the form and ancestors checked below.
      if (!control.isConnected) return;

      if (isLive(control)) return;

      // An <a href="#"> would otherwise jump the scroll position to the top,
      // which on a long table looks like the page reset itself.
      if (control instanceof HTMLAnchorElement) event.preventDefault();

      toast.notImplemented(labelFor(control));
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // Re-bound per route only so the listener never outlives a navigation in
    // a way that leaks across route-level remounts.
  }, [pathname]);

  return null;
}

function isLive(el: HTMLElement): boolean {
  if (el.closest("[data-live], [data-live-region]")) return true;

  // Anything that submits a form is doing real work — logout is the live
  // example today.
  if (el instanceof HTMLButtonElement) {
    if (el.type === "submit" || el.type === "reset") return true;
    if (el.form) return true;
  }

  if (el instanceof HTMLAnchorElement) {
    const href = el.getAttribute("href");
    if (href && href !== "#" && !href.startsWith("#")) return true;
  }

  // Labels drive their own control (file pickers, checkboxes, the search box).
  if (el.closest("label")) return true;

  return false;
}

/** Human label for the toast: visible text, then aria-label, then title. */
function labelFor(el: HTMLElement): string {
  const text = el.textContent?.replace(/\s+/g, " ").trim();
  if (text) return truncate(text);

  const aria = el.getAttribute("aria-label") ?? el.getAttribute("title");
  if (aria) return truncate(aria.trim());

  return "This action";
}

function truncate(value: string): string {
  return value.length > 40 ? `${value.slice(0, 39)}…` : value;
}
