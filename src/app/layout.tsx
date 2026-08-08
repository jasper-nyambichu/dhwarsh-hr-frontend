import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import { siteConfig } from "@/config/site";

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

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
};

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
        {/* eslint-disable-next-line @next/next/no-page-custom-font --
            the rule warns about fonts added outside pages/_document.js, which
            does not apply here: this is the App Router root layout, so the
            stylesheet is emitted on every page, not one. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
