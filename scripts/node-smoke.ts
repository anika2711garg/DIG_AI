/**
 * Smoke-test the node/vitest sandbox template end-to-end: run a vitest repro test
 * (one passing case, one failing case) NETWORK-OFF and confirm we parse a JUnit
 * report with the right verdicts — exactly the path the loop drives for JS/TS repos.
 *   set -a; source .env; set +a; npx tsx scripts/node-smoke.ts
 */
import { E2BSandbox } from "@libs/integrations/e2b";
import { javascriptAdapter as js } from "@libs/lang/javascript";

// BUG: subtracts instead of adds.
const SOURCE = `export function add(a, b) {\n  return a - b;\n}\n`;
const TEST = `import { test, expect } from 'vitest';
import { add } from './calc.js';

test('adds two positives', () => {
  expect(add(2, 2)).toBe(4); // 2 - 2 = 0 ≠ 4  → FAILS
});

test('adding zero is identity', () => {
  expect(add(2, 0)).toBe(2); // 2 - 0 = 2       → PASSES
});
`;

async function main() {
  const sandbox = new E2BSandbox();
  const command = js.testCommand("calc.test.js");
  console.log(`template: ${js.e2bTemplate}\ncommand : ${command}\n`);

  const r = await sandbox.run({
    template: js.e2bTemplate,
    networkEnabled: false,
    files: { "calc.js": SOURCE, "calc.test.js": TEST },
    command,
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

  // Expect exactly: 2 tests, 1 pass, 1 fail — proving vitest ran AND JUnit parsed.
  const ok = tests === 2 && passed === 1 && failures === 1 && errors === 0;
  console.log(ok ? "\n✓ vitest ran network-off and JUnit parsed correctly" : "\n✗ unexpected report shape");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
