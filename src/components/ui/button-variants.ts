import { cva, type VariantProps } from "class-variance-authority";

/**
 * Button styling, shared by the Server-Component markup that only needs classes
 * and the Client-Component <Button> that needs behaviour.
 *
 * Kept in its own module with no "use client" so importing the classes from a
 * Server Component does not drag a client bundle along with them.
 *
 * Sizes are touch-first: `h-10` is 40px, and the `min-w` floors stop an
 * icon-only button collapsing below the ~44px pointer target on a phone.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg",
    "font-body-md text-body-md font-semibold transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-60",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary shadow-ambient-1 hover:bg-primary-container",
        secondary:
          "bg-surface-container text-on-surface hover:bg-surface-container-high",
        outline:
          "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
        ghost: "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
        danger: "bg-error text-on-error hover:bg-error/90",
      },
      size: {
        sm: "h-8 min-w-8 px-3 text-[11px]",
        md: "h-10 min-w-10 px-4",
        lg: "h-11 min-w-11 px-6",
        icon: "size-10 shrink-0 rounded-full p-0",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
