"use client";

import { toast as sonner } from "sonner";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Typed toast helpers.
 *
 * Everything user-facing goes through here rather than calling sonner directly,
 * so every toast is the same card and copy stays consistent. Feedback for an HR
 * action is not decoration: an approval that silently succeeds and an approval
 * that silently fails look identical, and the user's next move differs completely.
 *
 * Every toast leaves on its own after a few seconds (hovering pauses it), except
 * one still waiting on `promise`. Errors stay a little longer because the user
 * usually has to act on them.
 */

type Tone = "success" | "error" | "info" | "warning" | "loading";

const TONES: Record<Tone, { title: string; icon: string; edge: string; color: string; duration: number }> = {
  success: { title: "Success", icon: "check_circle", edge: "border-l-[#22C55E]", color: "text-[#22C55E]", duration: 4000 },
  error: { title: "Error", icon: "cancel", edge: "border-l-[#F43F5E]", color: "text-[#F43F5E]", duration: 6000 },
  info: { title: "Info", icon: "info", edge: "border-l-[#3B82F6]", color: "text-[#3B82F6]", duration: 4000 },
  warning: { title: "Warning", icon: "error", edge: "border-l-[#FBBF24]", color: "text-[#FBBF24]", duration: 5000 },
  loading: { title: "Working", icon: "progress_activity", edge: "border-l-[#3B82F6]", color: "text-[#3B82F6]", duration: Infinity },
};

type ToastOptions = {
  description?: string;
  /** Milliseconds. Defaults to the tone's own duration. */
  duration?: number;
  /**
   * Primary affordance on the toast. Use for undo on an optimistic change —
   * it is the difference between a mis-tap costing a keystroke and costing a
   * page reload.
   */
  action?: { label: string; onClick: () => void };
};

function ToastCard({ id, tone, message, options }: { id: string | number; tone: Tone; message: string; options?: ToastOptions }) {
  const style = TONES[tone];

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border-l-4 bg-white py-3.5 pl-4 pr-3 font-body-md shadow-[0_8px_28px_rgba(0,0,0,0.12)] sm:w-[356px]",
        style.edge,
      )}
    >
      <Icon name={style.icon} filled className={cn("shrink-0 text-[34px]!", style.color, tone === "loading" && "animate-spin")} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold leading-tight text-[#111111]">{style.title}</p>
        <p className="mt-0.5 break-words text-[13px] leading-snug text-[#555555]">{message}</p>
        {options?.description ? <p className="mt-0.5 break-words text-[13px] leading-snug text-[#555555]">{options.description}</p> : null}
        {options?.action ? (
          <button data-live=""
            type="button"
            onClick={() => {
              options.action?.onClick();
              sonner.dismiss(id);
            }}
            className="mt-2 rounded-md bg-[#111111] px-2.5 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-85"
          >
            {options.action.label}
          </button>
        ) : null}
      </div>
      <button data-live=""
        type="button"
        aria-label="Dismiss"
        onClick={() => sonner.dismiss(id)}
        className="flex size-7 shrink-0 items-center justify-center self-start rounded-md text-[#444444] transition-colors hover:bg-black/5"
      >
        <Icon name="close" className="text-[18px]" />
      </button>
    </div>
  );
}

function show(tone: Tone, message: string, options?: ToastOptions, id?: string | number) {
  const duration = options?.duration ?? TONES[tone].duration;
  // Sonner spreads these over the id it generated, so `id: undefined` would leave the card holding the
  // wrong id and its dismiss button doing nothing. Pass the key only when there is one.
  return sonner.custom(
    (toastId) => <ToastCard id={toastId} tone={tone} message={message} options={options} />,
    id === undefined ? { duration } : { id, duration },
  );
}

export const toast = {
  success(message: string, options?: ToastOptions) {
    return show("success", message, options);
  },

  error(message: string, options?: ToastOptions) {
    return show("error", message, options);
  },

  info(message: string, options?: ToastOptions) {
    return show("info", message, options);
  },

  warning(message: string, options?: ToastOptions) {
    // A toast carrying an Undo has to outlive the user's "wait, what did I just
    // click?" pause, so it gets longer than the default.
    return show("warning", message, { duration: options?.action ? 10000 : undefined, ...options });
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
    const id = show("loading", messages.loading);
    promise.then(
      (data) => show("success", typeof messages.success === "function" ? messages.success(data) : messages.success, undefined, id),
      (error: unknown) => show("error", typeof messages.error === "function" ? messages.error(error) : messages.error, undefined, id),
    );
    return id;
  },

  /**
   * Honest feedback for a feature that has not been built yet.
   *
   * A button that looks live, is clicked, and does nothing teaches the user the
   * app is broken; one that says the feature is not available yet teaches them
   * to wait. Neither is a working feature, but only one of them is a lie.
   */
  notImplemented(feature: string) {
    return show("info", `${feature} isn't available yet.`);
  },

  dismiss(id?: string | number) {
    return sonner.dismiss(id);
  },
};
