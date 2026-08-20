"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { createContext, useContext, useLayoutEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type ThemeChoice = "light" | "dark" | "system";

const THEME_KEY = "neone-theme";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", emit);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", emit);
  };
}

function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice === "light" || choice === "dark") return choice;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(choice: ThemeChoice) {
  const resolved = resolveTheme(choice);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.classList.toggle("light", resolved === "light");
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

function getTheme(): ThemeChoice {
  return (localStorage.getItem(THEME_KEY) as ThemeChoice | null) ?? "system";
}

const ThemeContext = createContext<{
  theme: ThemeChoice;
  resolved: "light" | "dark";
  setTheme: (theme: ThemeChoice) => void;
  cycleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "system" as const);
  const resolved = useSyncExternalStore(
    subscribe,
    () => resolveTheme(getTheme()),
    () => "dark" as const,
  );

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme, resolved]);

  const value = useMemo(
    () => ({
      theme,
      resolved,
      setTheme: (next: ThemeChoice) => {
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
        emit();
      },
      cycleTheme: () => {
        const order: ThemeChoice[] = ["system", "light", "dark"];
        const next = order[(order.indexOf(theme) + 1) % order.length];
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
        emit();
      },
    }),
    [theme, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, cycleTheme } = useTheme();
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = `Theme: ${theme}. Click to change.`;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
      className={
        className ??
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--card-hover)] hover:text-[var(--text)]"
      }
    >
      <Icon className="h-4 w-4" strokeWidth={1.7} />
    </button>
  );
}
