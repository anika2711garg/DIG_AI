import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { GlowBackground } from "@/components/motion/GlowBackground";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <GlowBackground />
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
