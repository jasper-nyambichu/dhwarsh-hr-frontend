import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import { siteConfig } from "@/config/site";
import { getOrganisationBranding } from "@/lib/api/organisation";

import { Providers } from "./providers";
import "./globals.css";

/**
 * Be Vietnam Pro, self-hosted by next/font. The Stitch export pulls this from
 * the Google Fonts CDN; serving it from our own origin removes a render-
 * blocking third-party request and the layout shift that comes with it.
 *
 * Weights match those the Stitch type scale actually uses (400/500/600/700).
 */
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** The tab title carries the organisation's name from Admin → Settings, so each client sees its own. */
export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getOrganisationBranding();
  const organisation = name ?? siteConfig.name;
  return {
    title: { default: organisation, template: `%s · ${organisation}` },
    description: siteConfig.description,
    applicationName: organisation,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`light ${beVietnamPro.variable} h-full`}>
      <head>
        {/* Material Symbols is an icon font with no next/font loader, so it
            stays a CDN link. Preconnect first to cut the handshake cost. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display --
            the first rule warns about fonts added outside pages/_document.js, which
            does not apply here: this is the App Router root layout, so the
            stylesheet is emitted on every page, not one. The second prefers
            display=swap, which suits text fonts; for an icon font it shows each
            icon's name as text until the font arrives, so block is deliberate. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
      </head>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
