import { goAdapter } from "./go";
import { javascriptAdapter } from "./javascript";
import { pythonAdapter } from "./python";
import { rustAdapter } from "./rust";
import type { LanguageAdapter } from "./types";

export type { LanguageAdapter } from "./types";

/** All registered language adapters. Add one here to support a new language. */
export const ADAPTERS: readonly LanguageAdapter[] = [
  pythonAdapter,
  javascriptAdapter,
  goAdapter,
  rustAdapter,
];

export function getAdapter(id: string): LanguageAdapter | undefined {
  return ADAPTERS.find((a) => a.id === id);
}

/**
 * Pick the adapter for a repo from its files (manifests + extensions). The
 * highest-scoring adapter wins; Python is the fallback when nothing scores.
 */
export function detectAdapter(files: Record<string, string>): LanguageAdapter {
  let best: LanguageAdapter = pythonAdapter;
  let bestScore = -1;
  for (const adapter of ADAPTERS) {
    const score = adapter.detect(files);
    if (score > bestScore) {
      best = adapter;
      bestScore = score;
    }
  }
  return best;
}
