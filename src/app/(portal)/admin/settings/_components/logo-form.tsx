"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { removeCompanyLogoAction, uploadCompanyLogoAction } from "@/app/actions/company";
import { BentoCard } from "@/components/shared/bento-card";
import { ConfirmForm } from "@/components/shared/confirm-form";
import { FormMessage } from "@/components/shared/form-field";
import { Icon } from "@/components/ui/icon";
import type { ActionState } from "@/types";

/** Next refuses a Server Action body over 1 MB, so the limit sits just under it. */
const MAX_BYTES = 900 * 1024;

/** The logo printed on payslips, employee lists, invoices and agent statements. */
export function LogoForm({ hasLogo, version }: { hasLogo: boolean; version: string }) {
  const [uploadState, uploadAction, uploading] = useActionState<ActionState, FormData>(uploadCompanyLogoAction, { status: "idle" });
  const [removeState, removeAction, removing] = useActionState<ActionState, FormData>(removeCompanyLogoAction, { status: "idle" });
  const [tooLarge, setTooLarge] = useState(false);

  return (
    <BentoCard title="Company Logo" subtitle="Your organisation's logo: shown on the sign-in pages and the sidebar, and printed on payslips, employee lists, invoices, statements and every other download.">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-24 w-44 shrink-0 items-center justify-center rounded-lg border border-outline-variant/50 bg-surface-container-low p-2">
          {hasLogo ? (
            <Image src={`/api/company/logo?v=${version}`} alt="Current company logo" width={160} height={80} unoptimized className="max-h-20 w-auto object-contain" />
          ) : (
            <span className="flex items-center gap-2 text-xs text-outline">
              <Icon name="image" className="text-lg" />
              No logo yet
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <ConfirmForm
            action={uploadAction}
            confirm={{
              title: hasLogo ? "Replace the logo?" : "Upload this logo?",
              message: "It will appear on payslips, employee lists, invoices and agent statements.",
              confirmLabel: hasLogo ? "Replace" : "Upload",
              icon: "image",
            }}
            className="flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1 text-sm font-medium text-on-surface">
              Choose a logo
              <input
                type="file"
                name="file"
                accept="image/png,image/jpeg"
                required
                onChange={(event) => setTooLarge((event.target.files?.[0]?.size ?? 0) > MAX_BYTES)}
                className="min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-2 text-sm text-on-surface-variant"
              />
              <span className={`text-xs font-normal ${tooLarge ? "text-error" : "text-outline"}`}>
                {tooLarge ? "That file is too large. Choose one under 900 KB." : "PNG or JPEG, up to 900 KB."}
              </span>
            </label>
            <FormMessage state={uploadState} successText="Logo saved." />
            <button
              type="submit"
              disabled={uploading || tooLarge}
              className="min-h-11 self-start rounded-lg bg-primary px-6 py-2 font-body-md text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading…" : hasLogo ? "Replace Logo" : "Upload Logo"}
            </button>
          </ConfirmForm>

          {hasLogo ? (
            <ConfirmForm
              action={removeAction}
              confirm={{ title: "Remove the logo?", message: "It will no longer appear on payslips, employee lists, invoices and agent statements.", confirmLabel: "Remove", danger: true }}
              className="flex flex-col gap-2"
            >
              <FormMessage state={removeState} successText="Logo removed." />
              <button type="submit" disabled={removing} className="self-start text-sm font-medium text-error hover:underline disabled:opacity-60">
                {removing ? "Removing…" : "Remove logo"}
              </button>
            </ConfirmForm>
          ) : null}
        </div>
      </div>
    </BentoCard>
  );
}
