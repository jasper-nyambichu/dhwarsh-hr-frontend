"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

const PIN_LENGTH = 4;

/**
 * Four-box PIN entry with auto-advance and backspace-retreat.
 *
 * Replaces the inline querySelectorAll script in the Stitch export. Beyond
 * parity it adds paste support — pasting "1234" fills all four boxes instead
 * of dropping three characters, which the original silently did.
 *
 * The joined value is submitted via a single hidden input so the Server Action
 * receives one `pin` field rather than four.
 */
export function PinInput({
  name = "pin",
  invalid,
  disabled,
}: {
  name?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(() =>
    Array<string>(PIN_LENGTH).fill(""),
  );
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function focusBox(index: number) {
    refs.current[index]?.focus();
    refs.current[index]?.select();
  }

  function setDigit(index: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleChange(index: number, raw: string) {
    // Keep only the last digit typed, so overwriting a filled box works.
    const digit = raw.replace(/\D/g, "").slice(-1);

    if (!digit) {
      setDigit(index, "");
      return;
    }

    setDigit(index, digit);

    if (index < PIN_LENGTH - 1) {
      focusBox(index + 1);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setDigit(index - 1, "");
      focusBox(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < PIN_LENGTH - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, PIN_LENGTH);

    if (!pasted) return;

    event.preventDefault();

    const next = Array<string>(PIN_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i]!;
    }
    setDigits(next);
    focusBox(Math.min(pasted.length, PIN_LENGTH - 1));
  }

  return (
    <>
      <input type="hidden" name={name} value={digits.join("")} />

      <div className="flex justify-between gap-3">
        {digits.map((digit, index) => (
          <input
            // Fixed-length control; index is a stable identity here.
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            disabled={disabled}
            aria-label={`PIN digit ${index + 1}`}
            aria-invalid={invalid || undefined}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              "h-[56px] w-[52px] rounded-pin border bg-surface-container-lowest text-center",
              "font-display-greeting text-display-greeting text-navy shadow-sm",
              "transition-all focus:outline-none focus:ring-2 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-60",
              invalid
                ? "border-error focus:ring-error"
                : "border-line focus:ring-blue",
            )}
          />
        ))}
      </div>
    </>
  );
}
