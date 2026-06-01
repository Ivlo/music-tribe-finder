import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Teaches Vitest to transform JSX/TSX, just like Next does for the app.
  plugins: [react()],
  resolve: {
    // Mirror the `@/* -> src/*` alias from tsconfig.json so tests can import
    // app modules the same way the app does (e.g. `@/lib/tribe-composer`).
    alias: { "@": resolve(import.meta.dirname, "src") },
  },
  test: {
    // Simulated browser DOM for component tests (RTL + axe). Pure-logic tests
    // (compiler/composer) don't need it, but one env for the whole suite is simpler.
    environment: "jsdom",
    // Run our matcher registration + DOM cleanup before each test file.
    setupFiles: ["./vitest.setup.ts"],
    // Green until Sprint 1 adds real tests; flip to false once tests exist so a
    // mis-globbed suite (0 files picked up) fails loudly instead of passing silently.
    passWithNoTests: true,
  },
});
