"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Icon } from "@/components/ui/icon";

/** Reloads the page's data without a full reload, so the user stays where they are. */
export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      data-live=""
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon name="refresh" className={pending ? "animate-spin text-[18px]" : "text-[18px]"} />
      {pending ? "Trying again…" : "Try again"}
    </button>
  );
}
