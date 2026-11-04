"use client";

import { useEffect, useRef } from "react";

import { toast } from "@/lib/toast";
import type { ActionState } from "@/types";

/**
 * Wraps a Server Action so its result is toasted as soon as it returns. Use it instead of the hook when
 * success removes the form from the page, such as deleting a row: nothing is left to run an effect.
 */
export function withToast<T>(
  action: (previous: ActionState<T>, formData: FormData) => Promise<ActionState<T>>,
  successText: string,
) {
  return async (previous: ActionState<T>, formData: FormData): Promise<ActionState<T>> => {
    const result = await action(previous, formData);

    if (result?.status === "success") toast.success(successText);
    else if (result?.status === "error" && !result.fieldErrors) toast.error(result.message);

    return result;
  };
}

/**
 * Announces the result of a Server Action as a toast.
 *
 * Every wired form in the app returns `ActionState` from `useActionState`, so
 * the "did it work?" question has one shape — and this turns that shape into
 * feedback once, instead of each form growing its own effect.
 *
 * Guards against the two failure modes of naive `useEffect` + toast:
 *
 *  1. Re-firing on unrelated re-renders. The state object is compared by
 *     identity, so a parent re-render that hands back the same state does not
 *     produce a duplicate toast.
 *  2. Toasting the initial `idle` state on mount, which would greet the user
 *     with a notification about something they have not done yet.
 *
 * Field-level validation errors are deliberately *not* toasted — they render
 * next to the offending input, and a toast repeating them just covers the form.
 * Only the top-level message is announced.
 */
export function useActionToast<T>(
  state: ActionState<T>,
  messages: {
    success?: string | ((data: T) => string);
    /** Overrides the action's own error message. Rarely what you want. */
    error?: string;
    onSuccess?: (data: T) => void;
  } = {},
) {
  const seen = useRef<ActionState<T> | null>(null);

  useEffect(() => {
    if (state.status === "idle") return;
    if (seen.current === state) return;
    seen.current = state;

    if (state.status === "success") {
      const text =
        typeof messages.success === "function"
          ? messages.success(state.data)
          : messages.success;
      if (text) toast.success(text);
      messages.onSuccess?.(state.data);
      return;
    }

    // Prefer the server's message: it knows whether this was a validation
    // failure, a permission denial, or the backend being unreachable.
    toast.error(messages.error ?? state.message);
    // `messages` is intentionally excluded — callers pass an inline object
    // literal, so including it would re-run this on every render and defeat the
    // identity guard above. `state` is the only real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
