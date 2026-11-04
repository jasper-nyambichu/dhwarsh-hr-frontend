"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Password field with a show/hide toggle.
 *
 * Stitch drives this with an inline DOMContentLoaded script; as a React
 * component it becomes the local state below. Shared by the staff and agent
 * login screens, which render the control identically apart from the leading
 * icon.
 */
export function PasswordField({
  id = "password",
  name = "password",
  placeholder = "••••••••",
  required,
  autoComplete = "current-password",
  invalid,
  leadingIcon,
  className,
  value,
  onChange,
}: {
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  invalid?: boolean;
  /** Material Symbols ligature rendered inside the field, e.g. "lock". */
  leadingIcon?: string;
  className?: string;
  /** Pass both to hold the value in the parent. */
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative flex items-center">
      {leadingIcon ? (
        <Icon
          name={leadingIcon}
          className="absolute left-3 text-[18px] text-outline"
        />
      ) : null}

      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        {...(onChange ? { value, onChange: (event) => onChange(event.target.value) } : {})}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full rounded-lg border bg-surface-container-lowest font-body-md text-body-md text-on-surface transition-all",
          "placeholder:text-outline-variant focus:outline-none focus:ring-1",
          leadingIcon ? "pl-10" : "pl-3",
          "pr-10",
          invalid
            ? "border-error focus:border-error focus:ring-error/30"
            : "border-outline-variant focus:border-primary focus:ring-primary/30",
          className,
        )}
      />

      <button data-live=""
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 text-outline transition-colors hover:text-primary focus:outline-none"
      >
        <Icon
          name={visible ? "visibility" : "visibility_off"}
          className="text-[18px]"
        />
      </button>
    </div>
  );
}
