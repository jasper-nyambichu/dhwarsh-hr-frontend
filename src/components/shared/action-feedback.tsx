"use client";

import { useEffect, useRef } from "react";

import { toast } from "@/lib/toast";
import type { ActionState } from "@/types";

/**
 * Announces a form's result as a toast, once per submit. Field errors are left out: they show beside
 * their fields, and a toast repeating them only covers the form.
 */
export function ActionFeedback({ state, successText }: { state: ActionState<unknown>; successText: string }) {
  const seen = useRef<ActionState<unknown> | null>(null);

  useEffect(() => {
    if (state.status === "idle" || seen.current === state) return;
    seen.current = state;

    if (state.status === "success") toast.success(successText);
    else if (!state.fieldErrors) toast.error(state.message);
  }, [state, successText]);

  return null;
}
