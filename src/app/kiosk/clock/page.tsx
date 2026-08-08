import type { Metadata } from "next";

export const metadata: Metadata = { title: "Attendance Terminal" };

/**
 * Biometric attendance terminal. Authenticates by device token
 * (biometric_devices.device_token_hash) via DeviceAuthFilter, not a user
 * session, so it sits outside the (portal) group entirely.
 */
export default function KioskClockPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-8">
      <h1 className="font-display-greeting text-display-greeting text-on-surface">
        Attendance Terminal
      </h1>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
        Awaiting Stitch screen.
      </p>
    </div>
  );
}
