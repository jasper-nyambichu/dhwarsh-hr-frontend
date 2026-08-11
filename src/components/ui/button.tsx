"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Icon } from "@/components/ui/icon";
import { buttonVariants, type ButtonVariantProps } from "@/components/ui/button-variants";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type BaseProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonVariantProps & {
    /** Replaces the label with a spinner and blocks re-entry. */
    loading?: boolean;
    /** Announced to screen readers while `loading`. */
    loadingText?: string;
    icon?: string;
    children?: ReactNode;
  };

/**
 * Interactive button.
 *
 * Exists mainly so the loading state is not re-invented per form: a disabled
 * button with no spinner reads as "broken", and a spinner with no `disabled`
 * lets an impatient user submit payroll twice.
 */
export const Button = forwardRef<HTMLButtonElement, BaseProps>(function Button(
  { className, variant, size, block, loading, loadingText, icon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      // Live by construction — see StubActionBridge for why this matters.
      data-live=""
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {loading ? (
        <>
          <Icon name="progress_activity" className="animate-spin text-[18px]" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {icon ? <Icon name={icon} className="shrink-0 text-[18px]" /> : null}
          {children}
        </>
      )}
    </button>
  );
});

/**
 * Submit button that reads its own pending state from the enclosing form.
 *
 * `useFormStatus` only reports the form it is rendered inside, which is exactly
 * the scoping we want — a page with three forms should not grey out all of them
 * because one is in flight.
 */
export function SubmitButton({
  children,
  loadingText = "Working…",
  ...props
}: Omit<BaseProps, "type" | "loading">) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} loadingText={loadingText} {...props}>
      {children}
    </Button>
  );
}

/**
 * A control whose backend does not exist yet.
 *
 * Renders exactly like the real thing and says so when clicked. This is the
 * honest option: most screens in this app are still placeholder data, and a
 * primary-looking button that does nothing at all teaches the user the product
 * is broken rather than unfinished.
 *
 * Replace with <Button> the moment the action is wired.
 */
export function StubButton({
  feature,
  children,
  onClick,
  ...props
}: BaseProps & { feature?: string }) {
  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        toast.notImplemented(feature ?? textOf(children) ?? "This action");
      }}
    >
      {children}
    </Button>
  );
}

/** Best-effort label for the toast when no explicit `feature` is given. */
function textOf(node: ReactNode): string | undefined {
  if (typeof node === "string") return node.trim() || undefined;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    const joined = node.map(textOf).filter(Boolean).join(" ").trim();
    return joined || undefined;
  }
  return undefined;
}
