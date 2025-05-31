import { defineConfig } from "tsup";
import { execSync } from "child_process";
import { mkdirSync } from "fs";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    player: "src/Player/index.ts",
    volume: "src/Volume/index.ts",
    timeline: "src/Timeline/index.ts",
    "playback-rate": "src/PlaybackRate/index.ts",
    "time-display": "src/TimeDisplay/index.ts",
    captions: "src/Captions/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  clean: true,
  treeshake: true,
  external: ["react", "react-dom"],
  outDir: "dist",
  tsconfig: "tsconfig.build.json",
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".mjs",
    };
  },
  minify: true,
  sourcemap: true,
  async onSuccess() {
    mkdirSync("dist/cjs", { recursive: true });
    mkdirSync("dist/mjs", { recursive: true });

    try {
      execSync("mv dist/*.cjs dist/cjs/ 2>/dev/null || true");
      execSync("mv dist/*.mjs dist/mjs/ 2>/dev/null || true");
      execSync("mv dist/*.map dist/ 2>/dev/null || true");
    } catch (error) {
      console.error("Error during file organization:", error);
    }
  },
});
