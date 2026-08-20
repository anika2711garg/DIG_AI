"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ThemeToggle, useTheme, type ThemeChoice } from "@/lib/theme";
import { usePreferences, writePreferences, type UiPreferences } from "@/lib/preferences";

const FIELD =
  "mt-1.5 w-full max-w-xs rounded-lg border border-[var(--border-strong)] bg-[var(--background-mid)] px-3 py-2 text-sm text-[var(--text)]";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const prefs = usePreferences();

  function update(next: Partial<UiPreferences>) {
    writePreferences(next);
  }

  return (
    <AppShell title="Settings" crumbs="Dashboards / Settings">
      <div className="grid max-w-2xl gap-8">
        <section>
          <h2 className="text-sm font-medium">Appearance</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Light, dark, or follow the system preference.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(["system", "light", "dark"] as ThemeChoice[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                  theme === value
                    ? "border-[var(--primary)] bg-[var(--card-strong)] text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {value}
              </button>
            ))}
            <ThemeToggle />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium">Run defaults</h2>
          <label className="mt-3 block text-xs text-[var(--text-muted)]">
            Default mode
            <select
              value={prefs.defaultMode}
              onChange={(event) => update({ defaultMode: event.target.value as UiPreferences["defaultMode"] })}
              className={FIELD}
            >
              <option value="permissive">Permissive</option>
              <option value="strict">Strict</option>
            </select>
          </label>
        </section>

        <section>
          <h2 className="text-sm font-medium">Interface</h2>
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={prefs.compactTraces}
              onChange={(event) => update({ compactTraces: event.target.checked })}
            />
            Compact trace rows
          </label>
          <label className="mt-3 block text-xs text-[var(--text-muted)]">
            Timestamps
            <select
              value={prefs.timestamps}
              onChange={(event) => update({ timestamps: event.target.value as UiPreferences["timestamps"] })}
              className={FIELD}
            >
              <option value="relative">Relative</option>
              <option value="exact">Exact</option>
            </select>
          </label>
        </section>
      </div>
    </AppShell>
  );
}
