# End-to-end tests

Playwright specs live here (config: `playwright.config.ts`, run with `pnpm e2e`).

Kept separate from the colocated Vitest unit/component tests so the two runners
never try to execute each other's files.

Empty until **Sprint 1**, which adds:

- a smoke test of the full flow: Home → pick activity → Generate → Generating → Tribe
  with real tracks
- an `@axe-core/playwright` accessibility scan (zero serious/critical violations) on
  Home, Generating, and Tribe — including real color-contrast checks that jsdom can't do
