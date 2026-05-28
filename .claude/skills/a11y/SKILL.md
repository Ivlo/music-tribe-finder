---
name: a11y
description: >
  Accessibility audit for Music Tribe Finder UI (WCAG 2.1 AA). Checks semantic
  HTML, ARIA, keyboard navigation, focus, color/contrast, and reduced motion
  against the project a11y spec. Run before any PR that touches UI components.
allowed-tools: Read, Glob, Grep, Bash
---

## Source of truth
Accessibility *requirements* live in `ARCHITECTURE.md` §Accessibility
requirements — if this checklist and that table diverge, the doc wins. Target:
**WCAG 2.1 AA — fully usable without a mouse and without sight.** This skill is
the operational audit; `react-patterns` defers here for accessibility.

## Audit checklist

### Semantic HTML & structure
- Native elements before ARIA: `<button>`, `<a>`, `<input type="radio">`,
  `<ol>`, `<meter>` — never `<div onClick>`.
- One `<h1>` per screen, sequential headings (no skips). `<html lang="en">`.

### Forms (Home radiogroup)
- Activity tiles inside `<fieldset>` + `<legend>`.
- Generate button bound to the form; disabled until a tile is selected.

### Keyboard
- Tab order matches visual order; nothing mouse-only.
- Arrow keys move within the tile radiogroup; Enter activates. No keyboard traps.

### Focus
- Visible focus ring on every interactive element (`$border-focus` #FF9800);
  never `outline: none` without a replacement.
- Client route changes: move focus to the main `<h1>` / skip-nav target.

### ARIA & screen reader
- Icon-only buttons have `aria-label`.
- Generating screen (`loading.tsx`): `role="status" aria-live="polite"`.
- TrackItem: `aria-pressed`, `aria-label="Play preview of {title}"`,
  space/enter toggles; the no-preview state is shown in text, not color alone.
- Decorative emoji/icons: `aria-hidden="true"`. Album art: descriptive `alt`.

### Color & contrast
- 4.5:1 for body text, 3:1 for large text.
- Never convey state by color alone — pair with text/icon (the attribute meter
  has a fill AND a numeric label).

### Motion
- `prefers-reduced-motion: reduce` collapses the Generating animation
  (PhasedMessage) to static.

## Running the audit (use the project's tooling — not axe-cli)
1. Read the changed `.tsx` files in the diff.
2. `pnpm lint` — eslint-plugin-jsx-a11y (static checks).
3. `pnpm test` — component tests assert zero vitest-axe violations.
4. `pnpm e2e` — @axe-core/playwright runs axe on Home / Generating / Tribe.
   **Pass bar: zero serious/critical violations per screen.**
5. Manual pass (automated tools catch ~half): full keyboard-only walkthrough +
   VoiceOver (macOS) on each screen; confirm the experience is announced
   meaningfully.

## Reporting
- Group findings by axe impact: Critical / Serious / Moderate / Minor.
- Block the PR on any Critical or Serious finding.
- Per finding: the element, the failing criterion, and a concrete code fix.
