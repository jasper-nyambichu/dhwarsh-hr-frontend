"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const VALUE_FORMAT = "yyyy-MM-dd";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** Far enough back for a date of birth, far enough ahead for a planned off day. */
const YEARS_BACK = 80;
const YEARS_AHEAD = 10;
const VIEWPORT_GAP = 8;

type DateInputProps = {
  name?: string;
  /** Uncontrolled starting value, `yyyy-MM-dd`. */
  defaultValue?: string;
  /** Controlled value, `yyyy-MM-dd`. Use with `onChange`. */
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  /** Lets a `<label htmlFor>` name the control. */
  id?: string;
  "aria-label"?: string;
  placeholder?: string;
  /** Classes for the visible control, so it matches the fields around it. */
  className?: string;
};

function toDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Date field that always reads day, month, year ("04 Nov 2026"). A browser's own date box follows the
 * computer's language settings, so the same field could show 11/04/2026 on one machine and 04/11/2026
 * on another.
 *
 * The form still submits `yyyy-MM-dd`, exactly as `<input type="date">` did, so server actions, URLs and
 * the API see no difference.
 */
export function DateInput({
  name,
  defaultValue = "",
  value: controlled,
  onChange,
  min,
  max,
  required,
  disabled,
  id,
  "aria-label": ariaLabel,
  placeholder = "Choose a date",
  className,
}: DateInputProps) {
  const [internal, setInternal] = useState(defaultValue);
  const [lastDefault, setLastDefault] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);

  // A new default arrives when a filter link changes the page's dates.
  if (defaultValue !== lastDefault) {
    setLastDefault(defaultValue);
    setInternal(defaultValue);
  }

  const value = controlled ?? internal;
  const shown = value ? formatDate(value) : placeholder;
  const valueId = `${generatedId}-value`;

  // The picker keeps its value in state, so it has to follow the form when that resets.
  useEffect(() => {
    const form = fieldRef.current?.form;
    if (!form) return;
    const handleReset = () => setInternal(defaultValue);
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [defaultValue]);

  function choose(next: string) {
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
  }

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <div className="relative min-w-0">
      <button data-live=""
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={valueId}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full min-w-[10.5rem] items-center justify-between gap-2 whitespace-nowrap text-left disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <span id={valueId} className={value ? undefined : "text-outline"}>{shown}</span>
        <Icon name="calendar_month" className="shrink-0 text-[18px] text-outline" />
      </button>

      {/* Carries the value in the form and gives "required" the browser's normal message. */}
      <input
        ref={fieldRef}
        type="text"
        name={name}
        value={value}
        onChange={() => undefined}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
      />

      {open ? (
        <CalendarPanel
          anchorRef={triggerRef}
          value={value}
          min={min}
          max={max}
          canClear={!required}
          onChoose={(next) => {
            choose(next);
            close();
          }}
          onClose={close}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function CalendarPanel({
  anchorRef,
  value,
  min,
  max,
  canClear,
  onChoose,
  onClose,
  onDismiss,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  value: string;
  min?: string;
  max?: string;
  canClear: boolean;
  onChoose: (value: string) => void;
  /** Closes and returns focus to the field. */
  onClose: () => void;
  /** Closes because the user clicked elsewhere, so focus stays where they clicked. */
  onDismiss: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [today] = useState(() => new Date());
  const todayKey = format(today, VALUE_FORMAT);
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  // A disabled day cannot take focus, so every move stays on a day that can be chosen.
  const allowed = (date: Date) => (minDate && date < minDate ? minDate : maxDate && date > maxDate ? maxDate : date);

  const [focused, setFocused] = useState<Date>(() => selected ?? allowed(today));
  const [moveFocus, setMoveFocus] = useState(true);

  const place = useCallback(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!panel || !anchor) return;
    const box = anchor.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = panel;
    const fitsBelow = box.bottom + VIEWPORT_GAP + height <= window.innerHeight;
    const fitsAbove = box.top - VIEWPORT_GAP - height >= 0;
    const top = fitsBelow || !fitsAbove ? box.bottom + 4 : box.top - height - 4;
    const left = Math.min(box.left, window.innerWidth - width - VIEWPORT_GAP);
    panel.style.top = `${Math.max(VIEWPORT_GAP, top)}px`;
    panel.style.left = `${Math.max(VIEWPORT_GAP, left)}px`;
  }, [anchorRef]);

  // The top layer keeps it above table overflow and inside pop-up dialogs alike.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (panel?.showPopover && !panel.matches(":popover-open")) panel.showPopover();
    place();
  }, [place]);

  useEffect(() => {
    const dismissOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !anchorRef.current?.contains(target)) onDismiss();
    };
    document.addEventListener("pointerdown", dismissOutside);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchorRef, onDismiss, place]);

  const focusedKey = format(focused, VALUE_FORMAT);

  useEffect(() => {
    if (moveFocus) gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusedKey}"]`)?.focus();
  }, [focusedKey, moveFocus]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(focused), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(focused), { weekStartsOn: 1 }),
  });

  const firstYear = Math.min(today.getFullYear() - YEARS_BACK, minDate?.getFullYear() ?? Infinity, focused.getFullYear());
  const lastYear = Math.max(today.getFullYear() + YEARS_AHEAD, maxDate?.getFullYear() ?? -Infinity, focused.getFullYear());
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => lastYear - index);

  const isBlocked = (key: string) => Boolean((min && key < min) || (max && key > max));
  const todayBlocked = isBlocked(todayKey);

  function browse(next: Date) {
    setMoveFocus(false);
    setFocused(next);
  }

  function handleGridKeys(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, Date> = {
      ArrowLeft: addDays(focused, -1),
      ArrowRight: addDays(focused, 1),
      ArrowUp: addDays(focused, -7),
      ArrowDown: addDays(focused, 7),
      PageUp: addMonths(focused, -1),
      PageDown: addMonths(focused, 1),
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    setMoveFocus(true);
    setFocused(allowed(next));
  }

  const selectClass =
    "h-9 min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest px-1.5 text-sm font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary";
  const arrowClass =
    "flex size-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low";

  return (
    <div
      ref={panelRef}
      popover="manual"
      role="dialog"
      aria-label="Choose a date"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      className="fixed z-50 m-0 w-[19rem] max-w-[calc(100vw-1rem)] rounded-card border border-outline-variant/40 bg-surface-container-lowest p-3 text-on-surface shadow-ambient-1"
      style={{ inset: "auto" }}
    >
      <div className="mb-2 flex items-center gap-1">
        <button data-live="" type="button" aria-label="Previous month" onClick={() => browse(addMonths(focused, -1))} className={arrowClass}>
          <Icon name="chevron_left" className="text-[20px]" />
        </button>
        <select
          aria-label="Month"
          value={focused.getMonth()}
          onChange={(event) => browse(setMonth(focused, Number(event.target.value)))}
          className={cn(selectClass, "flex-1")}
        >
          {MONTHS.map((month, index) => <option key={month} value={index}>{month}</option>)}
        </select>
        <select
          aria-label="Year"
          value={focused.getFullYear()}
          onChange={(event) => browse(setYear(focused, Number(event.target.value)))}
          className={selectClass}
        >
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <button data-live="" type="button" aria-label="Next month" onClick={() => browse(addMonths(focused, 1))} className={arrowClass}>
          <Icon name="chevron_right" className="text-[20px]" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-outline" aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day} className="py-1">{day}</span>)}
      </div>

      <div ref={gridRef} className="grid grid-cols-7 gap-0.5" onKeyDown={handleGridKeys}>
        {days.map((day) => {
          const key = format(day, VALUE_FORMAT);
          const isSelected = key === value;
          return (
            <button data-live=""
              key={key}
              type="button"
              data-day={key}
              disabled={isBlocked(key)}
              tabIndex={key === focusedKey ? 0 : -1}
              aria-label={format(day, "EEEE, dd MMMM yyyy")}
              aria-pressed={isSelected}
              aria-current={key === todayKey ? "date" : undefined}
              onClick={() => onChoose(key)}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-30",
                isSelected
                  ? "bg-primary font-semibold text-on-primary"
                  : "hover:bg-surface-container-low enabled:hover:text-on-surface",
                !isSelected && !isSameMonth(day, focused) && "text-outline/70",
                !isSelected && key === todayKey && "font-semibold ring-1 ring-inset ring-primary",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-outline-variant/30 pt-2">
        <button data-live=""
          type="button"
          disabled={todayBlocked}
          onClick={() => onChoose(todayKey)}
          className="min-h-9 rounded-lg px-2 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
        >
          Today
        </button>
        {canClear && value ? (
          <button data-live=""
            type="button"
            onClick={() => onChoose("")}
            className="min-h-9 rounded-lg px-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
