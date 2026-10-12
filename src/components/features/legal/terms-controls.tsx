"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export type TermsSection = { id: string; title: string };

/**
 * The legal page is public and has no portal chrome, so these are the only
 * interactive pieces on it. Everything else is static server markup.
 */

/** Smooth-scrolls to an in-page anchor without leaving a stray `#` jump. */
function goTo(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

/**
 * Table of contents that highlights the section being read.
 *
 * `variant="rail"` is the sticky desktop list; `variant="inline"` is the
 * collapsible one under the title on phones and tablets. They share the
 * scroll-spy state, but only the visible one is rendered by the page.
 */
export function TermsToc({
  sections,
  variant,
}: {
  sections: readonly TermsSection[];
  variant: "rail" | "inline";
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // A section counts as "being read" once its top crosses into the upper fifth
    // of the viewport and stays so until the next one takes over.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const link = (section: TermsSection, index: number) => {
    const active = section.id === activeId;

    return (
      <a
        key={section.id}
        href={`#${section.id}`}
        aria-current={active ? "true" : undefined}
        onClick={(event) => {
          event.preventDefault();
          goTo(section.id);
          if (variant === "inline") {
            // Close the <details> so the section it jumped to is not covered.
            event.currentTarget.closest("details")?.removeAttribute("open");
          }
        }}
        className={cn(
          "block rounded-lg px-2.5 py-1.5 font-body-md text-body-md font-medium transition-colors",
          active
            ? "bg-secondary-fixed/40 font-bold text-primary"
            : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary",
        )}
      >
        {index + 1}. {section.title}
      </a>
    );
  };

  if (variant === "rail") {
    return (
      <nav aria-label="Table of contents" className="flex flex-col gap-1">
        {sections.map(link)}
      </nav>
    );
  }

  return (
    <details className="group rounded-lg border border-outline-variant/30 bg-surface-container-low">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-body-md text-body-md font-semibold text-on-surface [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Icon name="toc" className="text-[18px] text-primary" />
          On this page
        </span>
        <Icon
          name="expand_more"
          className="text-[18px] text-secondary transition-transform group-open:rotate-180"
        />
      </summary>
      <nav
        aria-label="Table of contents"
        className="grid grid-cols-1 gap-1 border-t border-outline-variant/20 px-2 pb-2 pt-2 sm:grid-cols-2"
      >
        {sections.map(link)}
      </nav>
    </details>
  );
}

/**
 * Returns to wherever the reader came from — the loan request form, normally.
 * When the page was opened directly (a shared link, a new tab) there is no
 * history to step back through, so it goes to `fallbackHref` instead.
 */
export function BackButton({
  fallbackHref,
  children,
  className,
  icon,
  variant = "ghost",
}: {
  fallbackHref: string;
  children: React.ReactNode;
  className?: string;
  icon: string;
  variant?: "ghost" | "primary" | "outline";
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      data-live=""
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className={cn(buttonVariants({ variant, size: "md" }), className)}
    >
      <Icon name={icon} className="text-[18px]" />
      {children}
    </button>
  );
}

export function PrintButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      data-live=""
      title="Print these terms"
      aria-label="Print these terms"
      onClick={() => window.print()}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "rounded-lg",
        className,
      )}
    >
      <Icon name="print" className="text-[18px]" />
    </button>
  );
}