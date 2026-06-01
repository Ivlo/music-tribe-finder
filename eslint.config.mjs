import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Accessibility is a hard requirement (WCAG 2.1 AA), not polish. Next ships
  // jsx-a11y rules at `warn`; here we re-apply the full strict set at `error`, so
  // a11y regressions fail lint + CI instead of being silently ignored. We borrow
  // only the strict config's `rules` (not its `plugins`) because eslint-config-next
  // already registers the `jsx-a11y` plugin — redeclaring it is a flat-config error.
  // Placed AFTER the Next configs so these severities win.
  {
    rules: jsxA11y.flatConfigs.strict.rules,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
