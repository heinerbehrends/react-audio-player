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
});
