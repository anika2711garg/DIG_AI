"use client";

import type { ReactNode } from "react";

import { CommandPalette } from "@/components/command/CommandPalette";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/lib/theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
        <CommandPalette />
      </ToastProvider>
    </ThemeProvider>
  );
}
