import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Native <select> with the portal's field styling and a Material chevron.
 *
 * Server Component, no state: it is meant for GET filter forms, where the
 * browser submits the chosen value as a query param and the page re-reads it
 * from `searchParams`. A native control keeps the OS picker on phones.
 */
export function FilterSelect({
  name,
  label,
  defaultValue,
  options,
  className,
}: {
  name: string;
  /** Read by screen readers only — the visible context is the field's own first option. */
  label: string;
  defaultValue?: string;
  options: readonly { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <label htmlFor={`filter-${name}`} className="sr-only">
        {label}
      </label>
      <select
        id={`filter-${name}`}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest pl-3 pr-9 font-body-md text-body-md font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name="expand_more"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline"
      />
    </div>
  );
}