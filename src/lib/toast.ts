"use client";

import { toast as sonner } from "sonner";

/**
 * Typed toast helpers.
 *
 * Everything user-facing goes through here rather than calling sonner directly,
 * so copy stays consistent and the "nothing happened" failure mode has one
 * place to be fixed. Feedback for an HR action is not decoration: an approval
 * that silently succeeds and an approval that silently fails look identical,
 * and the user's next move differs completely.
 *
 * Messages are sentence-case and say what happened to *what*, not just that
 * something happened — "Leave request approved" beats "Success".
 */

type ToastOptions = {
  description?: string;
  /** Milliseconds. Defaults to the Toaster's own duration. */
  duration?: number;
  /**
   * Primary affordance on the toast. Use for undo on an optimistic change —
   * it is the difference between a mis-tap costing a keystroke and costing a
   * page reload.
   */
  action?: { label: string; onClick: () => void };
};

export const toast = {
  success(message: string, options?: ToastOptions) {
    return sonner.success(message, options);
  },

  error(message: string, options?: ToastOptions) {
    // Errors hang around longer — the user usually has to act on them, and a
    // failure that vanishes before it is read is worse than no toast at all.
    return sonner.error(message, { duration: 7000, ...options });
  },

  info(message: string, options?: ToastOptions) {
    return sonner.info(message, options);
  },

  warning(message: string, options?: ToastOptions) {
    // A toast carrying an Undo has to outlive the user's "wait, what did I just
    // click?" pause, so it gets the long duration rather than the default.
    const duration = options?.action ? 10000 : 6000;
    return sonner.warning(message, { duration, ...options });
  },

  /**
   * Pending → settled, driven by a promise. Use for anything that leaves the
   * browser, so a slow network reads as "working" rather than "broken".
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
  ) {
    return sonner.promise(promise, messages);
  },

  /**
   * Honest feedback for a control whose backend does not exist yet.
   *
   * Most screens in this app are still placeholder data. A button that looks
   * live, is clicked, and does nothing teaches the user the app is broken; one
   * that says the feature is not connected yet teaches them to wait. Neither is
   * a working feature, but only one of them is a lie.
   */
  notImplemented(feature: string) {
    return sonner.info(`${feature} isn't connected yet`, {
      description: "This screen is running on placeholder data until the API is wired up.",
      duration: 4000,
    });
  },

  dismiss(id?: string | number) {
    return sonner.dismiss(id);
  },
};
