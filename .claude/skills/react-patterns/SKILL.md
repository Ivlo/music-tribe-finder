---
name: react-patterns
description: >
  Enforce Music Tribe Finder's Next.js App Router + React conventions:
  Server/Client component boundaries, accessibility (WCAG 2.1 AA),
  Tailwind-only styling, and faithful 1:1 mapping from design.pen.
  Use when creating, refactoring, or auditing components, routes, or layouts.
argument-hint: "[component-name or feature area]"
allowed-tools: Read, Glob, Grep, Bash
---

## Architecture context

Next.js App Router + TypeScript + Tailwind. Pure logic in `src/lib/`,
reusable UI in `src/components/<Name>/`, routes in `src/app/`. Tracks come
from committed static pools (harvested from Deezer at build time) — the
request path makes no external API calls and the browser never fetches data.
See `CLAUDE.md`, `ARCHITECTURE.md`, `DESIGN.md`.

## Patterns to follow

### Server vs Client components (the core App Router rule)

- **Default to Server Components.** Add `'use client'` ONLY when the component
  needs interactivity: state, effects, event handlers, refs, or browser APIs.
- Data is fetched/computed in async Server Components (the pipeline runs in
  `app/tribe/[activityId]/page.tsx`). Never fetch data in the browser.
- The only client components in Sprint 1 are `<TrackItem />` (audio playback)
  and `<PhasedMessage />` (timers). Keep `'use client'` as low in the tree as
  possible — push interactivity into leaf components.
- No `useEffect` data-fetching. No React Query, no SWR, no client-side fetch.

### Routing & loading/error states (App Router files, not wrappers)

- Loading UI = a `loading.tsx` segment file (the Generating screen) — not a
  hand-rolled spinner or `<Suspense>` boilerplate.
- Error UI = `error.tsx` (client) per segment; `not-found.tsx` for unknown
  activities; `global-error.tsx` for root. Don't hand-roll an ErrorBoundary.
- Code-split heavy client-only widgets with `next/dynamic`, not `React.lazy`.

### Accessibility — a hard requirement (WCAG 2.1 AA)

Accessibility is non-negotiable, but its rules are NOT duplicated here. The full
checklist, the project's a11y commands, and the pass bar live in the **`a11y`
skill** (which defers to `ARCHITECTURE.md` §Accessibility as source of truth).

- Baseline reflexes while writing: semantic HTML first / ARIA second, every
  interactive element keyboard-operable with a visible focus ring, never state
  by color alone, decorative icons `aria-hidden`, meaningful images get `alt`.
- Before finishing UI work, run the **`a11y`** audit (`/a11y`).
- Component tests use Vitest + React Testing Library with role-based queries
  (`getByRole`, `getByLabelText`) — if the test can find it, it's accessible.

### Styling

- Tailwind utility classes in JSX only. No global CSS beyond Tailwind base,
  no CSS Modules, no inline `style` except truly dynamic values.
- Map tokens/spacing/states from `design.pen` 1:1 — see `DESIGN.md`.

### Composition & performance (only when warranted)

- Keep components small and single-purpose. Use a compound pattern
  (`<X.Trigger/>`, `<X.Item/>`) ONLY for genuinely coupled sub-parts — most
  MVP components don't need it. Don't pre-abstract.
- Add `useCallback`/`useMemo` only with a measured reason, not by default.
- No list virtualization — tribes are 10–20 items.

### Determinism

- Components render server-computed data. Never `Math.random()` or `Date.now()`
  in render — all variation flows through the URL `seed`.

## When invoked (target: $ARGUMENTS)

1. Read the target component(s)/route(s) with Read.
2. Verify the Server/Client split — flag needless `'use client'` and any
   client-side data fetching.
3. Check accessibility: semantic elements, keyboard operability, focus rings,
   `aria-*`, no color-only state. Cross-check `pnpm lint` (jsx-a11y).
4. Check styling is Tailwind-only and matches the `.pen` design.
5. Suggest refactors with before/after examples. Don't over-abstract.
