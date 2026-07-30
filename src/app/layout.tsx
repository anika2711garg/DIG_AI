import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Issue → PR",
  description:
    "Autonomous issue-to-PR agent — reproduces a bug, patches it, and verifies the fix in a network-off sandbox, then gates on human approval.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
