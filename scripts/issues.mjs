/**
 * Validates the tickets in `issues/` and regenerates `issues/README.md`.
 *
 * One ticket per file, one contract for all of them: the frontmatter below is
 * the whole schema, and the index is derived from it rather than maintained by
 * hand. That is the property the two documents this replaced kept losing —
 * `REVIEW-FINDINGS.md` and `BACKLOG.md` each held half of every open item, so a
 * finding could be resolved in one and still open in the other, and twice was.
 *
 *   node scripts/issues.mjs            validate, then rewrite the index
 *   node scripts/issues.mjs --check    validate, and fail if the index is stale
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, sep } from "node:path";

const DIR = "issues";
const INDEX = join(DIR, "README.md");

/** Ordered: the index renders epics in this order, and it is the reading order. */
const EPICS = {
  accessibility: "Accessibility",
  surface: "Public surface & DX",
  features: "Features",
  architecture: "Architecture & style",
  tests: "Tests",
  performance: "Performance",
  packaging: "Packaging",
};

const STATUSES = ["open", "partial", "resolved", "rejected"];
const SEVERITIES = ["P0", "P1", "P2", "P3", "none"];
const ORIGINS = ["review", "backlog", "demand"];

const REQUIRED = [
  "id",
  "title",
  "epic",
  "status",
  "severity",
  "origin",
  "breaking",
];

/**
 * The frontmatter is deliberately flat — `key: value`, plus `[a, b]` lists — so
 * it needs no YAML dependency and stays greppable.
 */
function parseFrontmatter(text, file) {
  if (!text.startsWith("---\n")) throw new Error(`${file}: no frontmatter`);
  const end = text.indexOf("\n---", 4);
  if (end === -1) throw new Error(`${file}: unterminated frontmatter`);
  const data = {};
  for (const line of text.slice(4, end).split("\n")) {
    if (!line.trim()) continue;
    const at = line.indexOf(":");
    if (at === -1) throw new Error(`${file}: not a key/value line — ${line}`);
    const key = line.slice(0, at).trim();
    let value = line.slice(at + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    } else if (value.startsWith('"')) {
      value = JSON.parse(value);
    }
    data[key] = value;
  }
  return { data, body: text.slice(end + 4).trim() };
}

/**
 * `issues/<epic>/` for live work, `issues/resolved/<epic>/` for finished, and
 * the frontmatter decides both — checked below, so the path and the fields
 * cannot disagree.
 *
 * The epic leads the path rather than the id because ids have to stay put: 26
 * of them are cited from `src/`, the two test suites and `tasks/`, and git
 * history keeps the old name whatever a rename does. So the grouping lives
 * where it is free to change.
 */
const RESOLVED_DIR = "resolved";

/** `<epic>` and `resolved/<epic>` directories, wherever they exist. */
function listing() {
  const found = [];
  for (const prefix of ["", RESOLVED_DIR]) {
    const root = join(DIR, prefix);
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === RESOLVED_DIR) continue;
      for (const file of readdirSync(join(root, entry.name))) {
        if (file.endsWith(".md")) {
          found.push({
            file,
            dir: join(prefix, entry.name),
            folderEpic: entry.name,
          });
        }
      }
    }
  }
  return found;
}

const tickets = [];
const problems = [];
const seen = new Map();

for (const { file, dir, folderEpic } of listing().sort((a, b) =>
  a.file.localeCompare(b.file),
)) {
  const path = join(DIR, dir, file);
  let parsed;
  try {
    parsed = parseFrontmatter(readFileSync(path, "utf8"), file);
  } catch (error) {
    problems.push(error.message);
    continue;
  }
  const { data } = parsed;

  const belongs = join(
    data.status === "resolved" ? RESOLVED_DIR : "",
    data.epic ?? "",
  );
  if (dir !== belongs) {
    problems.push(
      `${file}: status \`${data.status}\` belongs in ${DIR}/${belongs}/, not ${DIR}/${dir}/`,
    );
  }
  if (folderEpic !== data.epic) {
    problems.push(
      `${file}: sits in ${folderEpic}/ but declares epic \`${data.epic}\``,
    );
  }

  for (const key of REQUIRED) {
    if (data[key] === undefined) problems.push(`${file}: missing \`${key}\``);
  }
  if (data.epic && !EPICS[data.epic])
    problems.push(`${file}: unknown epic \`${data.epic}\``);
  if (data.status && !STATUSES.includes(data.status)) {
    problems.push(`${file}: status must be one of ${STATUSES.join(", ")}`);
  }
  if (data.severity && !SEVERITIES.includes(data.severity)) {
    problems.push(`${file}: severity must be one of ${SEVERITIES.join(", ")}`);
  }
  if (data.origin && !ORIGINS.includes(data.origin)) {
    problems.push(`${file}: origin must be one of ${ORIGINS.join(", ")}`);
  }
  if (!["true", "false"].includes(String(data.breaking))) {
    problems.push(`${file}: breaking must be true or false`);
  }
  if (data.id && !file.startsWith(`${data.id}-`)) {
    problems.push(
      `${file}: filename does not start with its id \`${data.id}\``,
    );
  }
  if (data.id && seen.has(data.id)) {
    problems.push(
      `${file}: id \`${data.id}\` already used by ${seen.get(data.id)}`,
    );
  }
  if (data.id) seen.set(data.id, file);
  if (!parsed.body)
    problems.push(`${file}: no body — a ticket has to say what it is`);

  tickets.push({ ...data, file, dir });
}

// A resolved ticket has to say what shipped; otherwise "done" is unfalsifiable.
for (const ticket of tickets) {
  if (ticket.status === "resolved" || ticket.status === "partial") {
    const body = readFileSync(join(DIR, ticket.dir, ticket.file), "utf8");
    if (!body.includes("## Resolution")) {
      problems.push(
        `${ticket.file}: ${ticket.status} without a \`## Resolution\` section`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error("Tickets do not match the contract:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

// ---------- the index ----------
/**
 * Live work first, then by severity, then by id.
 *
 * Not by id alone, though today that would look identical: the review numbered
 * each prefix in severity order, so `A1`–`A3` are its P0s and `A15` its last P2.
 * That holds only because everything was graded in one pass. The next P0 filed
 * is `A16` and sorts last, so the ordering has to come from the frontmatter —
 * ids stay stable because git history, code comments and test names cite them.
 */
const LIVE = { open: 0, partial: 1, resolved: 2, rejected: 3 };
const RANK = { P0: 0, P1: 1, P2: 2, P3: 3, none: 4 };

const byPriority = (a, b) =>
  LIVE[a.status] - LIVE[b.status] ||
  RANK[a.severity] - RANK[b.severity] ||
  a.id.localeCompare(b.id, "en", { numeric: true });

const count = (status) => tickets.filter((t) => t.status === status).length;

const lines = [
  "<!-- Generated by scripts/issues.mjs. Edit the tickets, not this file. -->",
  "",
  "# Issues",
  "",
  "Every open question, defect and improvement, one file each. The frontmatter is",
  "the contract: `id`, `title`, `epic`, `status`, `severity`, `origin`, `breaking`.",
  "",
  `**${count("open")} open · ${count("partial")} part-done · ${count("resolved")} resolved · ${count("rejected")} rejected**`,
  "",
  "`origin` says where a ticket came from: `review` is the pre-1.0 review, `demand`",
  "is the post-publish scan, `backlog` is everything raised during the work itself.",
  "",
];

const MARK = { open: " ", partial: "~", resolved: "x", rejected: "-" };

for (const [epic, heading] of Object.entries(EPICS)) {
  const mine = tickets.filter((t) => t.epic === epic).sort(byPriority);
  if (mine.length === 0) continue;
  const live = mine.filter(
    (t) => t.status === "open" || t.status === "partial",
  );
  lines.push(`## ${heading}`, "");
  lines.push(`${live.length} open of ${mine.length}.`, "");
  for (const t of mine) {
    const tags = [
      t.severity !== "none" ? t.severity : null,
      String(t.breaking) === "true" ? "**breaking**" : null,
      t.status === "rejected" ? "rejected" : null,
      t.status === "partial" ? "part-done" : null,
    ].filter(Boolean);
    const suffix = tags.length ? ` — ${tags.join(", ")}` : "";
    lines.push(
      `- [${MARK[t.status]}] [${t.id}](${t.dir.split(sep).join("/")}/${t.file}) ${t.title}${suffix}`,
    );
  }
  lines.push("");
}

const index = lines.join("\n").trimEnd() + "\n";
const current = (() => {
  try {
    return readFileSync(INDEX, "utf8");
  } catch {
    return null;
  }
})();

if (process.argv.includes("--check")) {
  if (current !== index) {
    console.error(
      `${INDEX} is stale. Run \`pnpm issues\` and commit the result.`,
    );
    process.exit(1);
  }
  console.log(`${tickets.length} tickets valid, index up to date.`);
} else {
  writeFileSync(INDEX, index);
  console.log(`${tickets.length} tickets valid, ${INDEX} written.`);
}
