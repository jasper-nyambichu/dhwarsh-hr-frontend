"use client";

import { useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { toast } from "@/lib/toast";

/**
 * Avatar with a "change photo" affordance.
 *
 * Its own Client Component so the page around it stays on the server.
 *
 * The markup this replaces was a hover-only <div cursor-pointer>: invisible to
 * keyboard users, unannounced to screen readers, and undiscoverable on touch
 * where there is no hover at all. It is now a real <button> that opens the file
 * picker, so it is tabbable, announced, and always visible on small screens.
 */
export function AvatarUpload({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("That file isn't an image", {
        description: "Choose a JPG, PNG or WebP file.",
      });
      return;
    }

    // 5 MB, matching the limit quoted on the other upload surfaces.
    if (file.size > 5 * 1024 * 1024) {
      toast.error("That image is too large", {
        description: "Maximum size is 5 MB.",
      });
      return;
    }

    // Local preview only — there is no upload endpoint yet, so the toast says
    // so rather than letting the new picture imply it was saved.
    setPreview(URL.createObjectURL(file));
    toast.notImplemented("Photo upload");
  }

  return (
    <div className="group/avatar relative size-28 shrink-0 sm:size-32">
      <div className="size-full overflow-hidden rounded-full border-4 border-surface-container-lowest shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element -- avatars are
            remote/user-supplied and not served through the image optimiser. */}
        <img src={preview ?? src} alt={alt} className="size-full object-cover" />
      </div>

      <button
        type="button"
        data-live=""
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-primary/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary group-hover/avatar:opacity-100 motion-reduce:transition-none"
      >
        <Icon name="photo_camera" className="mb-1" />
        <span className="text-xs font-medium">Change Photo</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
