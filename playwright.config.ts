import { defineConfig, devices } from "@playwright/test";

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: "./testE2E",
  // The specs share one page and one audio element, so they run serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 2,
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
