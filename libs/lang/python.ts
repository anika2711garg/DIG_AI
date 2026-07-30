import { PYTEST_TEMPLATE } from "@libs/integrations/e2b";
import { parseStackFrames } from "@libs/services/ingestor";
import { topLevelSymbols } from "@libs/services/localizer";
import { extractSymptom } from "@libs/services/reproducer";

import type { LanguageAdapter } from "./types";

const MANIFESTS = new Set(["pyproject.toml", "setup.py", "setup.cfg", "requirements.txt", "Pipfile"]);

/** Python + pytest. Reuses the original (tested) Python parsers. */
export const pythonAdapter: LanguageAdapter = {
  id: "python",
  displayName: "Python",
  sourceExtensions: [".py"],
  manifestFiles: ["pyproject.toml", "setup.py", "setup.cfg", "requirements.txt", "Pipfile"],
  e2bTemplate: PYTEST_TEMPLATE,
  testFramework: "pytest",
  reproTestExample: "test_repro.py",
  testCommand: (file) => `pytest ${file ?? ""} -q --junitxml=.junit.xml`.replace(/\s+/g, " ").trim(),
  parseStackFrames,
  extractSymptom,
  topLevelSymbols,
  detect: (files) => {
    let score = 0;
    for (const p of Object.keys(files)) {
      if (MANIFESTS.has(p.split("/").pop()!)) score += 5;
      if (p.endsWith(".py")) score += 1;
    }
    return score;
  },
};
