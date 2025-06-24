import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    player: "src/Player/index.ts",
    volume: "src/Volume/index.ts",
    timeline: "src/Timeline/index.ts",
    "playback-rate": "src/PlaybackRate/index.ts",
    "time-display": "src/TimeDisplay/index.ts",
  },
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
