import { isSensitivePath, validateAndNormalizePath } from "../security/paths";

/**
 * The Patcher applies the model's search/replace edit blocks to in-memory files.
 *
 * Every block must match its `oldText` EXACTLY ONCE. A block that doesn't (not
 * found, ambiguous, unsafe path, missing file) is a typed `patch_apply_failed`,
 * never a silent no-op or — the worst trap — a whole-file overwrite. Application
 * is atomic: if any block fails, nothing is committed.
 */

export interface EditBlock {
  file: string;
  /** Exact text to replace; must appear exactly once in the file. */
  oldText: string;
  newText: string;
}

export interface ApplyOk {
  ok: true;
  /** Full file map with edits applied (line endings normalized to \n). */
  files: Record<string, string>;
  changedFiles: string[];
  /** Changed files touching CI/secrets/lockfiles — the gatekeeper's red channel. */
  sensitiveFiles: string[];
}

export interface ApplyFail {
  ok: false;
  failureType: "patch_apply_failed";
  reason: string;
  block: EditBlock;
}

export type ApplyResult = ApplyOk | ApplyFail;

const normalizeEol = (s: string): string => s.replace(/\r\n/g, "\n");

const fail = (reason: string, block: EditBlock): ApplyFail => ({
  ok: false,
  failureType: "patch_apply_failed",
  reason,
  block,
});

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

export function applyEditBlocks(files: Record<string, string>, blocks: EditBlock[]): ApplyResult {
  // Work on a copy — nothing is committed unless every block applies.
  const updated: Record<string, string> = {};
  for (const [k, v] of Object.entries(files)) updated[k] = normalizeEol(v);
  const changed = new Set<string>();

  for (const block of blocks) {
    let safePath: string;
    try {
      safePath = validateAndNormalizePath(block.file);
    } catch (err) {
      return fail(`unsafe path: ${err instanceof Error ? err.message : String(err)}`, block);
    }
    if (!(safePath in updated)) {
      return fail(`file not found: ${block.file}`, block);
    }
    const oldText = normalizeEol(block.oldText);
    if (oldText.length === 0) {
      return fail("empty oldText (insertion not supported)", block);
    }
    const content = updated[safePath]!;
    const n = countOccurrences(content, oldText);
    if (n === 0) {
      return fail(`oldText not found in ${block.file}`, block);
    }
    if (n > 1) {
      return fail(`oldText matches ${n} times in ${block.file} — provide more context`, block);
    }
    // Function replacement → newText is inserted literally (no $&/$1 interpolation).
    updated[safePath] = content.replace(oldText, () => normalizeEol(block.newText));
    changed.add(safePath);
  }

  const changedFiles = [...changed];
  return {
    ok: true,
    files: updated,
    changedFiles,
    sensitiveFiles: changedFiles.filter(isSensitivePath),
  };
}
