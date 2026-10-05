import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const fromHere = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

// "/" unless the host serves the site under a path, as GitHub Pages does.
const base = process.env["DEMO_BASE"] ?? "/";

export default defineConfig({
  root: fromHere("."),
  base,
  // The repo's `public/`, shared with the dev app and the E2E suite, rather than
  // a second copy of every track.
  publicDir: fromHere("../public"),
  plugins: [react()],
  resolve: {
    // The examples import the package by name, as a consumer would. Here that
    // name is the source, so the demo cannot drift from the code.
    alias: [
      {
        find: /^react-headless-audio-player\/styles\.css$/,
        replacement: fromHere("../src/styles.css"),
      },
      {
        find: /^react-headless-audio-player$/,
        replacement: fromHere("../src/index.ts"),
      },
    ],
    // An `examples/*/node_modules` left by a local `npm install` would
    // otherwise load a second React beside the library's.
    dedupe: ["react", "react-dom"],
  },
  define: {
    "import.meta.env.VITE_AUDIO_BASE": JSON.stringify(base),
  },
  server: { port: 5175, strictPort: true },
  preview: { port: 5175, strictPort: true },
  build: { outDir: fromHere("dist"), emptyOutDir: true },
});
