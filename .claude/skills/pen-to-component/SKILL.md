---
name: pen-to-component
description: >
  Generate a React component folder (component + Vitest/RTL test) from its
  node in design/design.pen, following the react-patterns conventions.
  Use when the user asks to build/scaffold a specific component from the design
  (e.g. "build the ActivityTile from the design", "/pen-to-component TrackItem").
argument-hint: "[ComponentName]"
allowed-tools: Read, Glob, Grep, Bash, mcp__pencil__open_document, mcp__pencil__get_editor_state, mcp__pencil__batch_get, mcp__pencil__snapshot_layout, mcp__pencil__get_screenshot, mcp__pencil__get_variables, mcp__pencil__get_guidelines
---

## Purpose
Generate a React component from its design in `design/design.pen`, following
the conventions in the **react-patterns** skill (Server/Client split, a11y,
Tailwind-only, determinism). Don't restate those rules here — read them.

Target component: **$ARGUMENTS**

## Before you start
- Read `DESIGN.md` (§Reusable components) for the design→code mapping: which
  `.pen` node corresponds to this component, the token names, and the states
  it must support.
- `.pen` files are encrypted — access them ONLY via the `pencil` MCP tools,
  never Read/Grep.

## Steps
1. **Read the design node**
   - `mcp__pencil__open_document` on `design/design.pen` (if not already open).
   - Find the node matching $ARGUMENTS (use DESIGN.md's component map).
   - `mcp__pencil__get_screenshot` + `mcp__pencil__snapshot_layout` +
     `mcp__pencil__batch_get` to read layout, properties, and every state
     (default / hover / focused / selected / disabled — whatever applies).
   - `mcp__pencil__get_variables` for design tokens (colors, spacing, radius,
     type) → map to Tailwind classes per `DESIGN.md`.
2. **Decide Server vs Client**
   - Default to a Server Component. Add `'use client'` ONLY if it needs state,
     effects, handlers, refs, or browser APIs (e.g. TrackItem audio,
     PhasedMessage timers). Follow react-patterns.
3. **Create the folder `src/components/<Name>/`** (Name = $ARGUMENTS):
   - `<Name>.tsx` — typed props (no `any`), semantic HTML, Tailwind classes
     mapped 1:1 from the design, and the accessibility required by the **`a11y`**
     skill (roles, `aria-*`, visible focus ring, no color-only state).
   - `<Name>.test.tsx` — Vitest + React Testing Library:
     - renders with sensible props
     - asserts each visual state present in the design
     - uses role/label queries (`getByRole`, `getByLabelText`)
     - `vitest-axe` assertion: no accessibility violations
4. **Self-check** against react-patterns (run its checklist; invoke
   `/react-patterns <Name>` if useful).
5. **Report**: the file paths created, the Server/Client decision, and any
   design detail you couldn't confidently map (so the user can confirm).

## Conventions
- Component name = folder name = file name (PascalCase).
- Tailwind utility classes only; no inline styles except dynamic values.
- Don't over-abstract: no barrel/`index.ts` unless asked, no compound pattern
  unless the design has genuinely coupled sub-parts.
- The test runner (Vitest + RTL + jest-dom + vitest-axe) is configured in
  Sprint 0 — match whatever the project's existing test setup uses.
