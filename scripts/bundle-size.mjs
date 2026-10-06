/**
 * Guards the tree-shaking win **P1-a** paid for, which nothing else can see.
 *
 * P1-a found a `PlayButton`-only import pulling in `"Volume slider"` and
 * `"Timeline slider"` — 4,025 B gzipped for one button. The fix was structural:
 * no barrel re-export, no shared string table, each component holding its own
 * literals. **A15** then put 16 translatable strings behind that same rule,
 * because a central `defaultLabels` object would have undone all of it.
 *
 * None of that is visible in a type, a test or a lint rule. A refactor to a
 * shared defaults module looks tidier and is silently 3x worse, and the only
 * evidence is a byte count nobody re-measures by hand. Hence this.
 *
 *   node scripts/bundle-size.mjs           measure, and fail over budget
 *   node scripts/bundle-size.mjs --json    the same, as JSON
 *
 * Reads `dist/`, so `pnpm build` has to have run.
 */
import { rollup } from "rollup";
import { transform } from "esbuild";
import { gzipSync } from "node:zlib";
import { writeFileSync, mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DIST = join(process.cwd(), "dist/index.mjs");

if (!existsSync(DIST)) {
  console.error(`No ${DIST}. Run \`pnpm build\` first.`);
  process.exit(1);
}

// Parts a consumer opts into by rendering them. "Full surface" leaves them out,
// so it stays what everyone else pays, and each gets a row of its own (F6).
const OPT_IN = ["MediaSession"];
const SURFACE = Object.keys(await import(pathToFileURL(DIST).href)).filter(
  (name) => !OPT_IN.includes(name),
);

/**
 * Ceilings, in gzipped bytes, roughly 15–20 % above today's measurement.
 *
 * Loose on purpose. The number moves a little whenever rollup or esbuild change
 * their output, and a budget that trips on a toolchain bump gets raised
 * reflexively until it means nothing. What it has to catch is a component
 * acquiring another's vocabulary — the P1-a regression was ~2.6 kB, an order of
 * magnitude outside this headroom.
 *
 * A failure is not "make it smaller". It is "find out what got pulled in".
 */
const BUDGETS = [
  { name: "PlayButton only", imports: "{ PlayButton }", max: 1500 },
  { name: "MuteButton only", imports: "{ MuteButton }", max: 1500 },
  { name: "Timeline only", imports: "{ Timeline }", max: 4500 },
  { name: "Time only", imports: "{ Time }", max: 2500 },
  // The root every consumer imports, then the root with the part only some do:
  // the part is unusable without the root, and alone would count the store
  // twice. The lock screen is a part so that the first row never pays (F6).
  { name: "AudioPlayer only", imports: "{ AudioPlayer }", max: 2600 },
  {
    name: "AudioPlayer + MediaSession",
    imports: "{ AudioPlayer, MediaSession }",
    max: 3700,
  },
  // Raised from 8500 for `<PlayerRoot>` and `usePlayerRootProps`: new public
  // API, paid only by code that imports it.
  { name: "Full surface", imports: `{ ${SURFACE.join(", ")} }`, max: 8700 },
  { name: "Full surface + MediaSession", imports: "* as all", max: 10200 },
];

/**
 * Strings that belong to exactly one component. A single-component bundle
 * containing another's is the P1-a failure, and it is worth naming separately
 * from the byte count: the size tells you something regressed, this tells you
 * what.
 */
const FOREIGN_STRINGS = {
  "PlayButton only": ["Volume slider", "Timeline slider", "Playback rate"],
  "MuteButton only": ["Timeline slider", "Playback rate", "Show time"],
  "Time only": ["Volume slider", "Timeline slider", "Playback rate"],
  "AudioPlayer only": ["mediaSession"],
};

const dir = mkdtempSync(join(tmpdir(), "bundle-size-"));
const results = [];

try {
  for (const { name, imports, max } of BUDGETS) {
    const entry = join(dir, `${name.replace(/\W/g, "_")}.mjs`);
    // `console.log` so nothing is dead code: without a use, rollup drops the
    // import entirely and every bundle measures the same empty module.
    writeFileSync(
      entry,
      `import ${imports} from ${JSON.stringify(DIST)};\nconsole.log(${
        imports.startsWith("*") ? "all" : imports
      });\n`,
    );

    const bundle = await rollup({
      input: entry,
      // React is the consumer's, and is never counted.
      external: (id) => id === "react" || id.startsWith("react/"),
      onwarn: () => {},
    });
    const { output } = await bundle.generate({ format: "esm" });
    await bundle.close();

    const code = output
      .map((chunk) => (chunk.type === "chunk" ? chunk.code : ""))
      .join("");
    const { code: minified } = await transform(code, {
      minify: true,
      format: "esm",
    });
    const bytes = gzipSync(Buffer.from(minified), { level: 9 }).length;

    const leaked = (FOREIGN_STRINGS[name] ?? []).filter((probe) =>
      minified.includes(probe),
    );
    results.push({ name, bytes, max, over: bytes > max, leaked });
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const failed = results.filter((r) => r.over || r.leaked.length > 0);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const { name, bytes, max, over, leaked } of results) {
    const headroom = Math.round((1 - bytes / max) * 100);
    // A leak fails the row even under budget: a ceiling loose enough to survive
    // a toolchain bump is loose enough to hide a small one.
    const bad = over || leaked.length > 0;
    console.log(
      `${bad ? "FAIL" : "ok  "} ${name.padEnd(27)} ${String(bytes).padStart(5)} B / ${max} B gzip  (${headroom}% headroom)`,
    );
    for (const probe of leaked) {
      console.log(`     ↳ leaked another component's string: ${probe}`);
    }
  }
}

if (failed.length > 0) {
  const plural = failed.length === 1 ? "entry point" : "entry points";
  console.error(
    `\n${failed.length} ${plural} over budget or carrying another component's strings. Something new reached these modules — find what, rather than raising the ceiling (P1-a, A15).`,
  );
  process.exit(1);
}
