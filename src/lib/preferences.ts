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
  return merged;
}
