import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

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

export const metadata: Metadata = {
  title: "NEONE — Lumine Insights",
  description:
    "A minimal AI-powered system that transforms complex workflows into clear, glowing, effortless structures — helping you ship ideas faster.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <GlowBackground />
        {children}
      </body>
    </html>
  );
}
