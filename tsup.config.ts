import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  splitting: false,
  clean: true,
  treeshake: true,
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
  // Every component here is a client component — the library is built on
  // `useState` / `useEffect` / `useSyncExternalStore`. Without this directive,
  // importing the package from a React Server Component (the Next.js App
  // Router default) fails at build time.
  banner: { js: '"use client";' },
  // `banner` alone does not survive: tsup runs a Rollup treeshake pass after
  // esbuild, and that pass drops the directive. Re-apply it here rather than
  // turning `treeshake` off, which costs ~500 B gzipped.
  async onSuccess() {
    const { readFile, writeFile } = await import("node:fs/promises");
    const out = "dist/index.mjs";
    const code = await readFile(out, "utf8");
    if (!code.startsWith('"use client"')) {
      await writeFile(out, '"use client";\n' + code);
    }
  },
});
