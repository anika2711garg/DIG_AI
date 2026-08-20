import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { GlowBackground } from "@/components/motion/GlowBackground";
import { Providers } from "@/components/providers";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const instrument = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: "NEONE — Lumine Insights",
  description:
    "Issue in, draft PR out. A human-gated issue-to-PR agent that reproduces, patches, and verifies before anything ships.",
};

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("neone-theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=d?"dark":"light";document.documentElement.classList.add(r);document.documentElement.style.colorScheme=r;}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <GlowBackground />
          <div className="grain" aria-hidden />
          {children}
        </Providers>
      </body>
    </html>
  );
}
