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
  banner: { js: '"use client";' },
  async onSuccess() {
    const { readFile, writeFile } = await import("node:fs/promises");
    const out = "dist/index.mjs";
    const code = await readFile(out, "utf8");
    if (!code.startsWith('"use client"')) {
      await writeFile(out, '"use client";\n' + code);
    }
  },
});
