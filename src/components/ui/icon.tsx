import { cn } from "@/lib/utils";

/**
 * Material Symbols Outlined glyph.
 *
 * Stitch uses Material Symbols throughout rather than Lucide, so this wrapper
 * keeps the icon font usage in one place. The font is loaded in the root
 * layout. `lucide-react` remains available for anything Stitch does not cover.
 *
 * Usage mirrors the Stitch markup one-to-one:
 *   <Icon name="check_circle" filled className="text-[18px]" />
 */
export function Icon({
  name,
  filled = false,
  className,
  ...props
}: {
  /** Material Symbols ligature, e.g. "arrow_forward", "visibility_off". */
  name: string;
  /** Sets FILL 1 on the variable axis. */
  filled?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined leading-none", className)}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      {...props}
    >
      {name}
    </span>
  );
}
