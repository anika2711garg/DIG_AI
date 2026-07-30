/**
 * Smoke-test a language's sandbox template end-to-end: run a canned test with one
 * PASSING and one FAILING case NETWORK-OFF and confirm we parse a JUnit report with
 * the right verdicts — the exact path the loop drives.
 *   set -a; source .env; set +a; npx tsx scripts/lang-smoke.ts <go|rust|js>
 */
import { E2BSandbox } from "@libs/integrations/e2b";
import { getAdapter } from "@libs/lang/registry";

interface Fixture {
  files: Record<string, string>;
  target?: string;
}

// Each source has a deliberate bug (subtracts) so one assertion fails, one passes.
const FIXTURES: Record<string, Fixture> = {
  go: {
    files: {
      "go.mod": "module calc\n\ngo 1.22\n",
      "calc.go": "package calc\n\nfunc Add(a, b int) int {\n\treturn a - b\n}\n",
      "calc_test.go": [
        "package calc",
        "",
        'import "testing"',
        "",
        "func TestAddPositives(t *testing.T) {",
        '\tif Add(2, 2) != 4 { t.Fatalf("expected 4, got %d", Add(2, 2)) }',
        "}",
        "",
        "func TestAddZero(t *testing.T) {",
        '\tif Add(2, 0) != 2 { t.Fatalf("expected 2, got %d", Add(2, 0)) }',
        "}",
        "",
      ].join("\n"),
    },
  },
  rust: {
    files: {
      "Cargo.toml": '[package]\nname = "calc"\nversion = "0.1.0"\nedition = "2021"\n',
      "src/lib.rs": "pub fn add(a: i32, b: i32) -> i32 {\n    a - b\n}\n",
      "tests/calc.rs": [
        "use calc::add;",
        "",
        "#[test]",
        "fn adds_positives() {",
        "    assert_eq!(add(2, 2), 4);",
        "}",
        "",
        "#[test]",
        "fn adds_zero() {",
        "    assert_eq!(add(2, 0), 2);",
        "}",
        "",
      ].join("\n"),
    },
  },
  js: {
    files: {
      "calc.js": "export function add(a, b) {\n  return a - b;\n}\n",
      "calc.test.js": [
        "import { test, expect } from 'vitest';",
        "import { add } from './calc.js';",
        "test('adds positives', () => { expect(add(2, 2)).toBe(4); });",
        "test('adds zero', () => { expect(add(2, 0)).toBe(2); });",
        "",
      ].join("\n"),
    },
    target: "calc.test.js",
  },
};

const ADAPTER_ID: Record<string, string> = { go: "go", rust: "rust", js: "javascript" };

async function main() {
  const lang = process.argv[2];
  if (!lang || !FIXTURES[lang]) {
    console.error(`usage: lang-smoke.ts <${Object.keys(FIXTURES).join("|")}>`);
    process.exit(2);
  }
  const adapter = getAdapter(ADAPTER_ID[lang]!)!;
  const fixture = FIXTURES[lang]!;
  const command = adapter.testCommand(fixture.target);
  console.log(`lang=${lang}  template=${adapter.e2bTemplate}\ncommand: ${command}\n`);

  const r = await new E2BSandbox().run({
    template: adapter.e2bTemplate,
    networkEnabled: false,
    files: fixture.files,
    command,
    timeoutMs: 120_000,
  });

  console.log(`exitCode=${r.exitCode} timedOut=${r.timedOut} durationMs=${r.durationMs}`);
  if (!r.report) {
    console.error("\n✗ NO JUnit report parsed. stdout/stderr follow:\n");
    console.error(r.stdout);
    console.error(r.stderr);
    process.exit(1);
  }

  const { tests, passed, failures, errors } = r.report;
  console.log("report:", { tests, passed, failures, errors });
  for (const c of r.report.cases) {
    console.log(`  ${c.status.toUpperCase().padEnd(7)} ${c.id}${c.message ? `  — ${c.message}` : ""}`);
  }

  const ok = tests === 2 && passed === 1 && failures === 1 && errors === 0;
  console.log(ok ? "\n✓ ran network-off and JUnit parsed correctly" : "\n✗ unexpected report shape");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
