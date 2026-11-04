"use client";

import Image from "next/image";
import { useState } from "react";

import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The signed-in person's photo, or their initials when they have none or it cannot be loaded.
 * `photoVersion` is null without a photo. A new value makes the browser fetch the new image.
 */
export function UserAvatar({
  name,
  photoVersion,
  size,
  className,
}: {
  name: string;
  photoVersion?: number | null;
  /** Pixels. */
  size: number;
  className?: string;
}) {
  const [failedVersion, setFailedVersion] = useState<number | null>(null);
  const showPhoto = photoVersion != null && failedVersion !== photoVersion;

  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.32) }}
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container font-bold text-on-primary", className)}
    >
      {showPhoto ? (
        <Image
          src={`/api/profile/photo?v=${photoVersion}`}
          alt=""
          width={size}
          height={size}
          unoptimized
          onError={() => setFailedVersion(photoVersion)}
          className="size-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
