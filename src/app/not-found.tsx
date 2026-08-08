import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-8 text-center">
      <p className="font-display-greeting text-display-greeting text-on-surface">
        Page not found
      </p>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
        That page does not exist, or you do not have access to it.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-navy px-4 py-2 font-body-md text-body-md font-bold text-white"
      >
        Go back
      </Link>
    </div>
  );
}
