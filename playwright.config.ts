import { defineConfig, devices } from "@playwright/test";

// E2E config. Tests live in ./e2e (kept separate from Vitest's colocated unit
// tests so the two runners never try to execute each other's files).
export default defineConfig({
  testDir: "./e2e",

  // Fail the run if a `test.only` was committed by accident (CI only).
  forbidOnly: !!process.env.CI,
  // Flaky-test cushion: retry twice in CI, never locally (fail fast while developing).
  retries: process.env.CI ? 2 : 0,

  use: {
    // Tests can navigate with page.goto("/") instead of the full URL.
    baseURL: "http://localhost:3000",
    // Capture a trace (DOM + network timeline) the first time a test retries —
    // invaluable for debugging a CI-only failure.
    trace: "on-first-retry",
  },

  // Only Chromium for the MVP; add Firefox/WebKit later with one block each.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Playwright boots the app itself before tests, then waits for it to respond.
  // build + start exercises the PRODUCTION render (pre-rendered HTML), faithful to
  // the build-time-harvest architecture — not the dev server.
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    // Reuse a server you already have running locally; always boot fresh in CI.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
