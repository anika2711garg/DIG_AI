import type { EvalTask } from "./types";

const issue = (repo: string, number: number, title: string, body: string): EvalTask["issue"] => ({
  repo,
  number,
  title,
  body,
  labels: ["bug"],
  comments: [],
});

/**
 * A curated eval set of seeded bugs across Python, JavaScript and TypeScript,
 * each with a HELD-OUT gold test. The harness auto-detects the language per task
 * (detectAdapter) and scores each fix on the adapter's own runtime — so the same
 * loop is exercised across pytest and vitest. The `wrong-issue` task's code is
 * already correct — the agent should fail it honestly (cant_reproduce), which is
 * correct behaviour, not a miss.
 *
 * SWE-bench Verified plugs into the same harness once per-task E2B templates
 * exist (Phase 5); the task shape here is the same idea (FAIL_TO_PASS).
 */
export const SEED_TASKS: EvalTask[] = [
  {
    id: "off-by-one-add",
    repo: "seed/calc",
    files: { "calc.py": "def add(a, b):\n    return a + b - 1\n" },
    issue: issue(
      "seed/calc",
      1,
      "add() is off by one",
      "add(2, 3) returns 4, expected 5.\nFails with:  AssertionError: assert 4 == 5",
    ),
    gold: {
      file: "test_gold.py",
      code: "from calc import add\n\n\ndef test_gold_add():\n    assert add(10, 20) == 30\n    assert add(0, 0) == 0\n",
    },
    note: "arithmetic off-by-one (clear symptom)",
  },
  {
    id: "wrong-operator-multiply",
    repo: "seed/mathops",
    files: { "mathops.py": "def multiply(a, b):\n    return a + b\n" },
    issue: issue(
      "seed/mathops",
      2,
      "multiply() adds instead of multiplying",
      "multiply(3, 4) returns 7, expected 12.\nFails with:  AssertionError: assert 7 == 12",
    ),
    gold: {
      file: "test_gold.py",
      code: "from mathops import multiply\n\n\ndef test_gold_multiply():\n    assert multiply(3, 4) == 12\n    assert multiply(5, 5) == 25\n",
    },
    note: "wrong operator",
  },
  {
    id: "string-reverse-noop",
    repo: "seed/strutil",
    files: { "strutil.py": "def reverse(s):\n    return s\n" },
    issue: issue(
      "seed/strutil",
      3,
      "reverse() doesn't reverse the string",
      "reverse('abc') returns 'abc', expected 'cba'.\nFails with:  AssertionError: assert 'abc' == 'cba'",
    ),
    gold: {
      file: "test_gold.py",
      code: "from strutil import reverse\n\n\ndef test_gold_reverse():\n    assert reverse('hello') == 'olleh'\n    assert reverse('') == ''\n",
    },
    note: "no-op string function",
  },
  {
    id: "js-off-by-one-add",
    repo: "seed/calc-js",
    files: {
      "package.json": '{\n  "name": "seed-calc-js",\n  "version": "1.0.0"\n}\n',
      "calc.js": "export function add(a, b) {\n  return a + b - 1;\n}\n",
    },
    issue: issue(
      "seed/calc-js",
      5,
      "add() is off by one",
      "add(2, 3) returns 4, expected 5.\nFails with:  AssertionError: expected 4 to be 5",
    ),
    gold: {
      file: "gold.test.js",
      code: "import { test, expect } from 'vitest';\nimport { add } from './calc.js';\n\ntest('gold add', () => {\n  expect(add(10, 20)).toBe(30);\n  expect(add(0, 0)).toBe(0);\n});\n",
    },
    note: "JavaScript / vitest — arithmetic off-by-one",
  },
  {
    id: "ts-wrong-operator-multiply",
    repo: "seed/mathops-ts",
    files: {
      "package.json": '{\n  "name": "seed-mathops-ts",\n  "version": "1.0.0"\n}\n',
      "tsconfig.json": '{\n  "compilerOptions": { "strict": true }\n}\n',
      "mathops.ts": "export function multiply(a: number, b: number): number {\n  return a + b;\n}\n",
    },
    issue: issue(
      "seed/mathops-ts",
      6,
      "multiply() adds instead of multiplying",
      "multiply(3, 4) returns 7, expected 12.\nFails with:  AssertionError: expected 7 to be 12",
    ),
    gold: {
      file: "gold.test.ts",
      code: "import { test, expect } from 'vitest';\nimport { multiply } from './mathops';\n\ntest('gold multiply', () => {\n  expect(multiply(3, 4)).toBe(12);\n  expect(multiply(5, 5)).toBe(25);\n});\n",
    },
    note: "TypeScript / vitest — wrong operator",
  },
  {
    id: "go-off-by-one-add",
    repo: "seed/calc-go",
    files: {
      "go.mod": "module calc\n\ngo 1.22\n",
      "calc.go": "package calc\n\nfunc Add(a, b int) int {\n\treturn a + b - 1\n}\n",
    },
    issue: issue(
      "seed/calc-go",
      7,
      "Add() is off by one",
      "Add(2, 3) returns 4, expected 5.\nFails with:  calc_test.go:8: expected 5, got 4",
    ),
    gold: {
      file: "calc_gold_test.go",
      code:
        'package calc\n\nimport "testing"\n\nfunc TestGoldAdd(t *testing.T) {\n' +
        '\tif Add(10, 20) != 30 {\n\t\tt.Fatalf("expected 30, got %d", Add(10, 20))\n\t}\n' +
        '\tif Add(0, 0) != 0 {\n\t\tt.Fatalf("expected 0, got %d", Add(0, 0))\n\t}\n}\n',
    },
    note: "Go / gotestsum — arithmetic off-by-one",
  },
  {
    id: "rust-wrong-operator-multiply",
    repo: "seed/mathlib-rs",
    files: {
      "Cargo.toml": '[package]\nname = "mathlib"\nversion = "0.1.0"\nedition = "2021"\n',
      "src/lib.rs": "pub fn multiply(a: i32, b: i32) -> i32 {\n    a + b\n}\n",
    },
    issue: issue(
      "seed/mathlib-rs",
      8,
      "multiply() adds instead of multiplying",
      "multiply(3, 4) returns 7, expected 12.\nPanics with:  assertion `left == right` failed: left: 7, right: 12",
    ),
    gold: {
      file: "tests/gold.rs",
      code:
        "use mathlib::multiply;\n\n#[test]\nfn gold_multiply() {\n" +
        "    assert_eq!(multiply(3, 4), 12);\n    assert_eq!(multiply(5, 5), 25);\n}\n",
    },
    note: "Rust / cargo-nextest — wrong operator",
  },
  {
    id: "wrong-issue-greet",
    repo: "seed/greet",
    files: { "greet.py": "def greet(name):\n    return f'Hello {name}'\n" },
    issue: issue(
      "seed/greet",
      4,
      "greet() returns the wrong prefix",
      "greet('World') returns 'Hi World', expected 'Hello World'.",
    ),
    gold: {
      file: "test_gold.py",
      code: "from greet import greet\n\n\ndef test_gold_greet():\n    assert greet('World') == 'Hello World'\n",
    },
    note: "WRONG issue — code is already correct; expect an honest cant_reproduce",
  },
];
