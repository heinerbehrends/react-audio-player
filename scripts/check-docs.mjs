/**
 * Enforces the split between the two review documents.
 *
 * `REVIEW-FINDINGS.md` is the evidence archive: what was found, and how each fix
 * was proven. `BACKLOG.md` is the only place that says what is still open. When
 * a finding is resolved it gets a row in the first and a strike-through in the
 * second — one fact, one home.
 *
 * The failure this catches is the one that already happened: T1, T2 and T3 were
 * recorded as resolved with their evidence while `BACKLOG.md` still listed them
 * as open, T1 annotated "Highest-value test fix".
 *
 * A finding can be resolved in part — S9 shipped `data-part` and still owes the
 * state attributes. Those rows are marked `_(part)_` in `BACKLOG.md` and are the
 * one case where a ref legitimately appears in both files: the shipped half has
 * its evidence row, the remainder stays open here.
 */
import { readFileSync } from "node:fs";

const FINDINGS = "REVIEW-FINDINGS.md";
const BACKLOG = "BACKLOG.md";

/**
 * A ref is the bold first cell of a table row: `**A5 / A7**` is two refs for one
 * row, since findings were merged where they turned out to be one bug.
 */
function refsInRow(row) {
  const firstCell = row.split("|")[1] ?? "";
  const bold = firstCell.match(/\*\*([^*]+)\*\*/);
  if (!bold) return [];
  return bold[1]
    .split("/")
    .map((ref) => ref.trim())
    .filter((ref) => /^[A-Z]\d+[a-z]?$|^P\d-[a-z]$/.test(ref));
}

function tableRows(markdown, fromHeading, toHeading) {
  const start = markdown.indexOf(fromHeading);
  const end = markdown.indexOf(toHeading, start + 1);
  if (start === -1 || end === -1) {
    throw new Error(
      `${fromHeading} … ${toHeading} not found — headings moved?`,
    );
  }
  return markdown
    .slice(start, end)
    .split("\n")
    .filter((line) => line.startsWith("|") && !/^\|\s*-+/.test(line));
}

const findings = readFileSync(FINDINGS, "utf8");
const backlog = readFileSync(BACKLOG, "utf8");

/** Everything in the two resolved tables counts as resolved-with-evidence. */
const resolved = new Set(
  [
    ...tableRows(findings, "### All 17 P0s — resolved", "### Also resolved"),
    ...tableRows(
      findings,
      "### Also resolved",
      "### Found during the work, not in the original review",
    ),
  ].flatMap(refsInRow),
);

const backlogRows = backlog.split("\n").filter((line) => line.startsWith("|"));
const refsInBacklog = new Set(backlogRows.flatMap(refsInRow));

/** Every finding in the file, from its `**A9. …**` heading. */
const allFindings = [
  ...new Set(
    [...findings.matchAll(/^\*\*([A-Z]\d+[a-z]?|P\d-[a-z])\.\s/gm)].map(
      (match) => match[1],
    ),
  ),
];

const problems = [];

/**
 * The gap that opened when the duplicate index was deleted from `Still open`:
 * S11 and S12 were resolved with nobody noticing they had never had a row here.
 * A finding is either resolved with evidence or open with a reason — never
 * neither.
 */
for (const ref of allFindings) {
  if (!resolved.has(ref) && !refsInBacklog.has(ref)) {
    problems.push(`${ref}: open, but has no row in ${BACKLOG}`);
  }
}

for (const row of backlogRows) {
  const refs = refsInRow(row);
  if (refs.length === 0) continue;
  if (row.includes("_(part)_")) continue;
  const struck = row.includes("~~");

  for (const ref of refs) {
    if (resolved.has(ref) && !struck) {
      problems.push(
        `${ref}: resolved in ${FINDINGS} but still open in ${BACKLOG}`,
      );
    }
    if (!resolved.has(ref) && struck) {
      problems.push(
        `${ref}: struck through in ${BACKLOG} with no evidence row in ${FINDINGS}`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error(`Review docs have drifted:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    `\nResolving a finding means both: an evidence row in ${FINDINGS}` +
      ` (what shipped, how it was proven) and a strike-through in ${BACKLOG}.`,
  );
  process.exit(1);
}

console.log(`Review docs agree on ${resolved.size} resolved findings.`);
