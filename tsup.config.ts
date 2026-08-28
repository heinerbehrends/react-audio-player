import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  splitting: false,
  clean: true,
  treeshake: true,
  // `react-dom` is not a peer dependency (S18) and nothing in `src/index.ts`
  // imports it. It stays listed so that if something ever does, the import is
  // left for the consumer's renderer rather than bundling a second React DOM.
  external: ["react", "react-dom"],
  outDir: "dist",
  tsconfig: "tsconfig.build.json",
  outExtension() {
    return {
      js: ".mjs",
    };
  },
  minify: true,
  sourcemap: true,
  banner: { js: '"use client";' },
  async onSuccess() {
    const { readFile, writeFile, copyFile } = await import("node:fs/promises");
    const out = "dist/index.mjs";
    const code = await readFile(out, "utf8");
    if (!code.startsWith('"use client"')) {
      await writeFile(out, '"use client";\n' + code);
    }
    // Copied, not an entry: an import would make the stylesheet mandatory and
    // break any consumer whose bundler has no CSS loader.
    await copyFile("src/styles.css", "dist/styles.css");
  },
});
