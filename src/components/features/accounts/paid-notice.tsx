import { Icon } from "@/components/ui/icon";

/** Shown once after the Accounts Office records a payment (the paid invoice leaves "To pay" with its form). */
export function PaidNotice() {
  return (
    <p role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-tertiary/30 bg-tertiary-container/20 px-4 py-3 text-sm font-medium text-tertiary">
      <Icon name="check_circle" className="text-[20px]" />
      Payment recorded. The Admin and the agent have been told.
    </p>
  );
}
