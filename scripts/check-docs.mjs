/**
 * Fails when a public symbol reaches `dist/index.d.ts` without its doc comment.
 * The editor reads only that file, and a comment can look right in the source
 * and still not arrive (B10):
 *
 * - attached to the wrong node: a block one declaration too early, or on an
 *   internal `const` that the export then casts;
 * - inlined away: a `forwardRef` member of an exported object, such as
 *   `Time.Elapsed`, emits as an inline type that keeps none of the JSDoc on its
 *   own `const`.
 *
 * So it checks every name in the final `export { … }` list, and every member of
 * an exported object type. Run after `pnpm build`.
 *
 *   node scripts/check-docs.mjs
 */
import { readFileSync, existsSync } from "node:fs";

const DTS = process.argv[2] ?? "dist/index.d.ts";
if (!existsSync(DTS)) {
  console.error(`No ${DTS}. Run \`pnpm build\` first.`);
  process.exit(1);
}
// The emitted file has Windows line endings on Windows.
const lines = readFileSync(DTS, "utf8").split(/\r?\n/);

/** Whether the nearest non-blank line above `index` closes a doc comment. */
function documented(index) {
  for (let i = index - 1; i >= 0; i--) {
    if (lines[i].trim() === "") continue;
    return lines[i].trim().endsWith("*/");
  }
  return false;
}

const exportLine = lines.findLast((line) => line.startsWith("export {"));
const names = exportLine
  .slice(exportLine.indexOf("{") + 1, exportLine.lastIndexOf("}"))
  .split(",")
  .map((entry) => entry.trim().replace(/^type /, ""))
  .filter(Boolean)
  // `local as exported`: the declaration carries the local name.
  .map((entry) => entry.split(" as ")[0]);

const missing = [];
for (const name of names) {
  const declaration = new RegExp(
    `^(declare )?(function|const|type|interface|class) ${name}\\b`,
  );
  const index = lines.findIndex((line) => declaration.test(line));
  if (index === -1) {
    missing.push(`${name}: no top-level declaration found`);
    continue;
  }
  if (!documented(index)) missing.push(name);

  // An exported object of parts: each member is public API too. A function's
  // object return type ends in `: {` as well, and its fields are not parts.
  if (/^declare const \w+: \{$/.test(lines[index])) {
    for (let i = index + 1; lines[i] !== "};"; i++) {
      const member = lines[i].match(/^ {4}(\w+): /);
      if (member && !documented(i)) missing.push(`${name}.${member[1]}`);
    }
  }
}

if (missing.length > 0) {
  console.error(
    `${missing.length} public ${missing.length === 1 ? "symbol has" : "symbols have"} no doc comment in ${DTS}:\n` +
      missing.map((name) => `  - ${name}`).join("\n") +
      "\nThe comment is in the source but did not arrive: check it sits on the exported declaration itself.",
  );
  process.exit(1);
}
console.log(`${names.length} exports documented in ${DTS}.`);
