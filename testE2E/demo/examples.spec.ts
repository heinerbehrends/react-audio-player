import { test, expect } from "@playwright/test";
import { labels } from "../test-utils";

/**
 * Each example on the demo page still renders and plays. A broken alias, a
 * missing track or an API change an example was not updated for fails here
 * instead of on the deployed site.
 */
for (const name of ["Minimal"]) {
  test(`${name} plays`, async ({ page }) => {
    await page.goto("/");
    const example = page.getByRole("region", { name });
    const timeline = example.getByRole("slider", { name: labels.timeline });

    // Enabled once the track reports a duration, so this also proves it loaded.
    await expect(timeline).not.toHaveAttribute("aria-disabled", "true");
    await example.getByRole("button", { name: labels.playAudio }).click();
    await expect
      .poll(async () => Number(await timeline.getAttribute("aria-valuenow")))
      .toBeGreaterThan(0);
  });
}
