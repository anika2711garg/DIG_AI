import { E2BSandbox, PYTEST_TEMPLATE } from "@libs/integrations/e2b";
import { verify } from "@libs/services/verifier";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * The verifier end-to-end on REAL pytest, network-off: record a baseline, apply
 * the fix + repro test, verify (baseline-aware, no regressions), then the revert
 * check. Auto-skips without E2B_API_KEY. Needs the pytest template built once.
 */
const hasKey = Boolean(process.env.E2B_API_KEY);

const CALC_BUGGY = "def add(a, b):\n    return a + b - 1\n\ndef sub(a, b):\n    return a - b\n";
const CALC_FIXED = "def add(a, b):\n    return a + b\n\ndef sub(a, b):\n    return a - b\n";
const EXISTING = "from calc import sub\n\n\ndef test_existing_behaviour():\n    assert sub(5, 3) == 2\n";
const REPRO = "from calc import add\n\n\ndef test_reproduces_bug():\n    assert add(2, 3) == 5\n";

describe.skipIf(!hasKey)("verifier — live E2B (baseline → patch → verify → revert)", () => {
  let sandbox: E2BSandbox;
  beforeAll(() => {
    sandbox = new E2BSandbox();
  });

  it("red → green → revert-confirmed on real pytest, network-off", async () => {
    const run = (files: Record<string, string>) =>
      sandbox.run({ template: PYTEST_TEMPLATE, networkEnabled: false, files, command: "pytest -q" });

    // 1. baseline: existing suite on buggy code (no repro test yet)
    const baseline = (await run({ "calc.py": CALC_BUGGY, "test_existing.py": EXISTING })).report;
    // 2. after patch: fixed code + repro test
    const afterPatch = (
      await run({ "calc.py": CALC_FIXED, "test_existing.py": EXISTING, "test_repro.py": REPRO })
    ).report;
    // 3. revert check: buggy code again, repro test still present
    const afterRevert = (
      await run({ "calc.py": CALC_BUGGY, "test_existing.py": EXISTING, "test_repro.py": REPRO })
    ).report;

    expect(baseline).toBeDefined();
    expect(afterPatch).toBeDefined();
    expect(afterRevert).toBeDefined();

    const repro = afterPatch!.cases.find((c) => c.name === "test_reproduces_bug");
    expect(repro, "repro case present in after-patch report").toBeDefined();
    const reproTestId = repro!.id;

    // Ground truth: repro passes after the fix, fails after revert.
    expect(afterPatch!.cases.find((c) => c.name === "test_reproduces_bug")!.status).toBe("passed");
    expect(afterRevert!.cases.find((c) => c.name === "test_reproduces_bug")!.status).toBe("failed");

    const verdict = verify({
      reproTestId,
      baseline: baseline!,
      afterPatch: afterPatch!,
      afterRevert: afterRevert!,
    });

    expect(verdict.verified).toBe(true);
    expect(verdict.regressions).toEqual([]);
    expect(verdict.reproFailsAfterRevert).toBe(true);
  }, 180_000);
});
