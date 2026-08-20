"use client";

import { useSyncExternalStore } from "react";

export type TimestampStyle = "relative" | "exact";

export interface UiPreferences {
  defaultMode: "strict" | "permissive";
  compactTraces: boolean;
  timestamps: TimestampStyle;
}

const KEY = "neone-prefs";

const DEFAULTS: UiPreferences = {
  defaultMode: "permissive",
  compactTraces: false,
  timestamps: "relative",
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribePreferences(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readPreferences(): UiPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UiPreferences>) };
  } catch {
    return DEFAULTS;
  }
}

export function writePreferences(next: Partial<UiPreferences>): UiPreferences {
  const merged = { ...readPreferences(), ...next };
  localStorage.setItem(KEY, JSON.stringify(merged));
  emit();
  return merged;
}

export function usePreferences() {
  return useSyncExternalStore(subscribePreferences, readPreferences, () => DEFAULTS);
}
