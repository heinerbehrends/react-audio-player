import { defineConfig, devices } from "@playwright/test";

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: "./testE2E",
  // The specs share one page and one audio element, so they run serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Locally a retry hides the flake from the only person positioned to fix it:
  // a row that fails then passes is reported green, and the run before a push is
  // where that matters. CI keeps two, where the noise is the machine's.
  retries: process.env.CI ? 2 : 0,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: "http://localhost:5173",

    // https://playwright.dev/docs/trace-viewer
    trace: "on-first-retry",

    viewport: { width: 1280, height: 720 },

    actionTimeout: 10000,
    navigationTimeout: 15000,

    colorScheme: "light",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm run vite",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  testMatch: "**/*.spec.*",
  testIgnore: "**/*.test.*",
});
