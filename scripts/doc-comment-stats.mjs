/**
 * Measures doc-comment frequency and size in `.d.ts` files: how many top-level
 * declarations and members carry a block, and how long the blocks run in
 * lines, words and sentences. For calibrating the public JSDoc against other
 * libraries' published declarations (G5).
 *
 *   node scripts/doc-comment-stats.mjs                      # dist/index.d.ts
 *   node scripts/doc-comment-stats.mjs "radix=path/to/dist"  # one or more label=path
 *
 * A path may be a file or a directory; directories are walked for `.d.ts` and
 * `.d.mts` files, skipping `node_modules`. Run `pnpm build` first for this
 * package's own file.
 */
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

function walk(path, out = []) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (entry !== "node_modules") walk(join(path, entry), out);
    }
  } else if (/\.d\.m?ts$/.test(path)) {
    out.push(path);
  }
  return out;
}

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
function percentile(xs, q) {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

const TOP_LEVEL =
  /^(export )?(declare )?(const|function|type|interface|class|enum|abstract class) \w+/;
// A member of an interface, object type or class: `  name?: …` or `  name(`.
const MEMBER = /^\s+(readonly )?(['"]?[\w$-]+['"]?)\??(\s*:\s|\s*\()/;
const TAGS_WITHOUT_PROSE =
  /^@(example|see|default|defaultValue|param|returns?|internal|public|version|since|deprecated|link|remarks)/;

function analyse(files) {
  const result = {
    files: files.length,
    codeLines: 0,
    top: 0,
    topDocumented: 0,
    members: 0,
    membersDocumented: 0,
    blocks: [],
  };
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    let pending = null;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith("/**") && !trimmed.startsWith("/***")) {
        const start = i;
        while (i < lines.length && !lines[i].includes("*/")) i++;
        const body = lines.slice(start, i + 1).map((l) =>
          l
            .trim()
            .replace(/^\/\*\*|\*\/$|^\*\s?/g, "")
            .trim(),
        );
        const prose = body
          .filter((l) => l && !TAGS_WITHOUT_PROSE.test(l))
          .join(" ");
        const words = prose.split(/\s+/).filter(Boolean).length;
        pending = {
          lines: i - start + 1,
          words,
          sentences:
            (prose.match(/[.!?](\s|$)/g) ?? []).length || (words ? 1 : 0),
          example:
            body.some((l) => l.startsWith("@example")) ||
            body.some((l) => l.startsWith("```")),
          tags: body
            .filter((l) => l.startsWith("@"))
            .map((l) => l.split(/\s/)[0]),
          license: /copyright|license/i.test(prose),
        };
        continue;
      }
      if (
        trimmed === "" ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("*")
      ) {
        continue;
      }
      result.codeLines++;
      const isTop = TOP_LEVEL.test(lines[i]);
      const isMember =
        !isTop &&
        MEMBER.test(lines[i]) &&
        !/^\s+(import|export|return)\b/.test(lines[i]);
      if (isTop) {
        result.top++;
        if (pending) result.topDocumented++;
      } else if (isMember) {
        result.members++;
        if (pending) result.membersDocumented++;
      }
      if (pending && !pending.license) {
        pending.kind = isTop ? "root" : isMember ? "member" : "other";
        result.blocks.push(pending);
      }
      pending = null;
    }
  }
  return result;
}

function report(label, r) {
  const f = (n, d = 1) => n.toFixed(d);
  const pct = (part, whole) => `${f((100 * part) / (whole || 1), 0)}%`;
  const L = r.blocks.map((b) => b.lines);
  const W = r.blocks.map((b) => b.words);
  const S = r.blocks.map((b) => b.sentences);
  console.log(
    `\n## ${label}  (${r.files} file${r.files === 1 ? "" : "s"}, ${r.codeLines} code lines)`,
  );
  console.log(
    `top-level decls ${r.top}, documented ${r.topDocumented} (${pct(r.topDocumented, r.top)}) | ` +
      `members ${r.members}, documented ${r.membersDocumented} (${pct(r.membersDocumented, r.members)})`,
  );
  console.log(
    `blocks ${r.blocks.length}: lines mean ${f(mean(L))} median ${percentile(L, 0.5)} ` +
      `p90 ${percentile(L, 0.9)} max ${Math.max(0, ...L)} | >15 lines: ${L.filter((x) => x > 15).length} | ` +
      `words mean ${f(mean(W))} median ${percentile(W, 0.5)} p90 ${percentile(W, 0.9)} | ` +
      `sentences mean ${f(mean(S))} median ${percentile(S, 0.5)} | ` +
      `1-sentence ${pct(S.filter((s) => s <= 1).length, S.length)} | ` +
      `@example ${r.blocks.filter((b) => b.example).length}`,
  );
  for (const kind of ["root", "member"]) {
    const set = r.blocks.filter((b) => b.kind === kind);
    if (!set.length) continue;
    const l = set.map((b) => b.lines);
    const w = set.map((b) => b.words);
    const s = set.map((b) => b.sentences);
    console.log(
      `  ${kind.padEnd(7)} n=${String(set.length).padStart(4)}  ` +
        `lines mean ${f(mean(l)).padStart(5)} median ${String(percentile(l, 0.5)).padStart(3)} ` +
        `p90 ${String(percentile(l, 0.9)).padStart(3)}  ` +
        `words mean ${f(mean(w)).padStart(6)} median ${String(percentile(w, 0.5)).padStart(3)} ` +
        `p90 ${String(percentile(w, 0.9)).padStart(3)}  sentences mean ${f(mean(s))}`,
    );
  }
  const tags = {};
  for (const b of r.blocks)
    for (const t of b.tags) tags[t] = (tags[t] ?? 0) + 1;
  const tagList = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(", ");
  if (tagList) console.log(`  tags: ${tagList}`);
}

const targets =
  process.argv.length > 2 ? process.argv.slice(2) : ["dist/index.d.ts"];
for (const target of targets) {
  const [label, path] = target.includes("=")
    ? target.split("=")
    : [target, target];
  report(label, analyse(walk(path)));
}
