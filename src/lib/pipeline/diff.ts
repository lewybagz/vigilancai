import { diffLines } from "diff";

export interface SourceDiff {
  /** Removed lines joined, for the diff view. */
  before: string;
  /** Added lines joined, for the diff view. */
  after: string;
  /** Unified-style hunks with a little context, for the classifiers. */
  hunks: string;
  removedChars: number;
  addedChars: number;
  /** Fraction of the document that changed (0-1). */
  churn: number;
}

const CONTEXT = 2;
const MAX_HUNK_CHARS = 8000;

export function diffText(oldText: string, newText: string): SourceDiff {
  const parts = diffLines(oldText, newText);
  const removed: string[] = [];
  const added: string[] = [];
  const hunks: string[] = [];
  let removedChars = 0;
  let addedChars = 0;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.added || p.removed) {
      const lines = p.value.replace(/\n$/, "").split("\n");
      if (p.removed) {
        removed.push(...lines);
        removedChars += p.value.length;
      } else {
        added.push(...lines);
        addedChars += p.value.length;
      }
      // Context: previous unchanged tail and next unchanged head.
      const prev = parts[i - 1];
      const next = parts[i + 1];
      const ctxBefore =
        prev && !prev.added && !prev.removed ? prev.value.replace(/\n$/, "").split("\n").slice(-CONTEXT) : [];
      const ctxAfter =
        next && !next.added && !next.removed ? next.value.replace(/\n$/, "").split("\n").slice(0, CONTEXT) : [];
      const sign = p.removed ? "-" : "+";
      hunks.push(
        [...ctxBefore.map((l) => `  ${l}`), ...lines.map((l) => `${sign} ${l}`), ...ctxAfter.map((l) => `  ${l}`)].join("\n"),
      );
    }
  }

  const total = Math.max(1, oldText.length + newText.length);
  let hunkText = hunks.join("\n...\n");
  if (hunkText.length > MAX_HUNK_CHARS) hunkText = hunkText.slice(0, MAX_HUNK_CHARS) + "\n... [diff truncated]";

  return {
    before: removed.join("\n"),
    after: added.join("\n"),
    hunks: hunkText,
    removedChars,
    addedChars,
    churn: Math.min(1, (removedChars + addedChars) / total),
  };
}

/** Lines that only differ by a date stamp or counter are almost never material. */
export function looksLikeBoilerplate(d: SourceDiff): boolean {
  const changed = (d.before + "\n" + d.after).trim();
  if (!changed) return true;
  if (changed.length < 40 && /\b(20\d\d|\d{1,2}:\d\d|updated|last modified|views?)\b/i.test(changed)) return true;
  return false;
}
