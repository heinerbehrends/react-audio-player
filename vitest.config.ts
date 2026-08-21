import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["**/*.test.{js,jsx,ts,tsx}"],
    exclude: ["**/node_modules/**", "**/*.spec.{js,jsx,ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./testJSDom/setup.ts"],
    reporters: ["default", "json"],
    outputFile: {
      json: "./test-results.json",
    },
    slowTestThreshold: 100,
    // A 22-core machine spawns ~21 jsdom workers and thrashes, failing ~170 tests
    // spuriously. Pool-agnostic cap, so it holds whichever pool Vitest defaults to.
    maxWorkers: 4,
  },
});
