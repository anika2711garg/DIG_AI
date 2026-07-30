import type { StackFrame } from "@libs/services/ingestor";
import type { Symbol } from "@libs/services/localizer";
import type { ReportedSymptom } from "@libs/services/reproducer";

/**
 * A LanguageAdapter is the ONLY language-specific surface. The verification core
 * (state machine, patcher, verifier's baseline+revert, reproduction grader, gate,
 * PR, eval) is framework-neutral; an adapter supplies the toolchain and the few
 * parsers a new language needs. Adding a language = writing one of these.
 *
 * Test output is unified: every adapter's `testCommand` emits JUnit XML to
 * `.junit.xml`, which the sandbox reads with the shared parser — so there is no
 * per-language report parsing.
 */
export interface LanguageAdapter {
  id: string;
  displayName: string;
  /** Extensions of files that can be localized + patched (never docs/config). */
  sourceExtensions: string[];
  /** Primary build-manifest basenames (package.json, Cargo.toml, go.mod, …). Shown
   *  to the model as prompt context so it knows package/crate names + import paths. */
  manifestFiles: string[];
  /** E2B template with the toolchain + a JUnit-emitting test runner. */
  e2bTemplate: string;
  /** Test-runner name, woven into the reproduce/patch prompts. */
  testFramework: string;
  /** Example reproduction-test filename, shown to the model in the prompt. */
  reproTestExample: string;
  /** Shell command that runs the tests (a file, or the whole suite) and writes
   *  JUnit to `.junit.xml` in the working directory. */
  testCommand(testFile?: string): string;
  parseStackFrames(text: string): StackFrame[];
  extractSymptom(text: string): ReportedSymptom;
  topLevelSymbols(content: string): Symbol[];
  /** Confidence that a repo is this language (manifest files + extensions). 0 = no. */
  detect(files: Record<string, string>): number;
}
