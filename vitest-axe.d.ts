// vitest-axe@0.1.0 ships its matcher types against the legacy global `Vi`
// namespace, which Vitest 4 no longer resolves for `expect(...)`. Re-declare the
// matchers against the modern `"vitest"` module so TS knows `.toHaveNoViolations()`.
import "vitest";
import type { AxeMatchers } from "vitest-axe/matchers";

declare module "vitest" {
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
