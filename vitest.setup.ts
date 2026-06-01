import { afterEach, expect } from "vitest";
import { cleanup } from "@testing-library/react";

// jest-dom: adds DOM-aware assertions like `.toBeDisabled()`,
// `.toHaveAccessibleName()`. The `/vitest` entry wires them into Vitest's
// `expect` and augments its types.
import "@testing-library/jest-dom/vitest";

// vitest-axe: register the accessibility matcher at runtime. Its type
// augmentation is handled separately in vitest-axe.d.ts (the package ships types
// for the legacy `Vi` namespace, which Vitest 4 ignores).
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);

// RTL leaves rendered components mounted in the jsdom document. Without globals
// enabled, auto-cleanup isn't registered — so we unmount after every test to keep
// them isolated (no leftover DOM bleeding from one test into the next).
afterEach(() => {
  cleanup();
});
