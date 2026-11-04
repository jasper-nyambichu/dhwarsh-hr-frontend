"use client";

import { useEffect, useState } from "react";

import { PasswordResetFlow, RESET_CHANNEL, ResetCard, type ResetMessage } from "@/components/features/auth/password-reset-flow";

const WAIT_FOR_OTHER_TAB_MS = 700;

type Outcome =
  | { kind: "checking" }
  | { kind: "handed-over" }
  | { kind: "here"; identifier: string; code: string }
  | { kind: "invalid" };

/**
 * Where the button in the email lands. The code is in the part of the link after the #, which the server
 * never sees. If the tab that asked for the code is open in this browser it receives the code and carries
 * on, and this tab just says so. Otherwise, on a phone for example, the reset continues right here.
 */
export function ResetLinkHandler() {
  const [outcome, setOutcome] = useState<Outcome>({ kind: "checking" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const identifier = params.get("u") ?? "";
    const code = params.get("c") ?? "";
    // Off the address bar and out of the history, so the code does not linger on this computer.
    window.history.replaceState(null, "", window.location.pathname);

    if (!identifier || !/^\d{6}$/.test(code)) {
      const timer = setTimeout(() => setOutcome({ kind: "invalid" }), 0);
      return () => clearTimeout(timer);
    }

    if (typeof BroadcastChannel === "undefined") {
      const timer = setTimeout(() => setOutcome({ kind: "here", identifier, code }), 0);
      return () => clearTimeout(timer);
    }

    const channel = new BroadcastChannel(RESET_CHANNEL);
    let settled = false;
    channel.onmessage = (event: MessageEvent<ResetMessage>) => {
      if (event.data.type === "received" && !settled) {
        settled = true;
        setOutcome({ kind: "handed-over" });
      }
    };
    channel.postMessage({ type: "code", identifier, code } satisfies ResetMessage);

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setOutcome({ kind: "here", identifier, code });
      }
    }, WAIT_FOR_OTHER_TAB_MS);

    return () => {
      clearTimeout(timer);
      channel.close();
    };
  }, []);

  if (outcome.kind === "here") {
    return <PasswordResetFlow backHref="/login" fromLink={{ identifier: outcome.identifier, code: outcome.code }} />;
  }
  if (outcome.kind === "handed-over") {
    return (
      <ResetCard title="Code filled in" description="Go back to your other tab to set your new password. You can close this one." backHref="/login">
        <span />
      </ResetCard>
    );
  }
  if (outcome.kind === "invalid") {
    return <PasswordResetFlow backHref="/login" />;
  }
  return (
    <ResetCard title="Checking your code" description="One moment…" backHref="/login">
      <span />
    </ResetCard>
  );
}
