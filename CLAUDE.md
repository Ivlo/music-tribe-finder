# Music Tribe Finder

A web MVP that turns an activity (e.g. "Snowboard", "Coding") into a curated
music "tribe": identity, mood/energy attributes, and 10–20 Deezer tracks.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Deezer API (public, no auth) — tracks harvested into static pools at build time (see ADR-002)
- Deployed on Vercel

## Architecture (high level)

Three screens: Home → Generating (`loading.tsx`) → Tribe Result.
Tracks are harvested from Deezer **at build time** into static pools; request-time
rendering reads those pools — no external API calls in the request path. The browser
receives fully-rendered HTML.

Core modules (under `src/`):

- `activity-registry` — static catalog of preset activities + Deezer source refs + authored attributes
- `profile-compiler` — pure: `(activity, seed) → ActivityProfile`
- `track-source` — I/O boundary; the only code that talks to Deezer (build-time harvest + request-time pool load)
- `tribe-composer` — pure: `(profile, tracks, seed) → Tribe`
- `app/` — Next.js routes (`/`, `/tribe/[activityId]`)

## Key invariants

- **Determinism**: same `(activityId, seed)` → same tribe, byte-for-byte. The URL is the entire state.
- **No DB, no accounts, no client-side track fetching.** Deezer is read at build time only (public API, no secret); the request path touches no external service.
- **No Deezer-specific types leak past `track-source`.** Composer takes a normalized `NormalizedTrack[]`.
- **Accessibility is a hard requirement, not a polish task.** WCAG 2.1 AA target. Semantic HTML first, ARIA second.
- **No randomness outside the `seed`.** Never `Math.random()` or `Date.now()` inside `profile-compiler` / `tribe-composer`.

## Commands

- `pnpm dev` — local dev server
- `pnpm test` — unit + golden-file tests
- `pnpm lint` — ESLint (includes `jsx-a11y`)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm e2e` — Playwright smoke + axe-core a11y checks

## Conventions

- Pure modules under `src/lib/`, page UI under `src/app/`.
- Pure functions: no `async`, no I/O, no side effects.
- All randomness flows through `seed` — never `Math.random()` in pure modules.
- Tailwind utility classes in JSX; no global CSS beyond Tailwind base.
- Tests live alongside source: `foo.ts` + `foo.test.ts`.

## Git commits

All commits follow [Conventional Commits](https://www.conventionalcommits.org/) — format: `<type>(<scope>)?: <subject>`.

- **Types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `build`, `ci`
- **Scope** (optional): module name, e.g. `track-source`, `profile-compiler`, `tribe-composer`, `activity-registry`, `roadmap`
- **Subject**: imperative, lowercase, no trailing period, ≤72 chars
- **Body** (optional): explain _why_, not _what_. Wrap at 100 chars.
- **Breaking changes**: `!` after type/scope (`feat(track-source)!: …`) or `BREAKING CHANGE:` footer

Examples:

- `feat(activity-registry): add skate and gym entries`
- `fix(track-source): handle 429 from deezer during harvest`
- `docs(roadmap): expand sprint 1 to 6 activities`
- `chore: add eslint jsx-a11y rules at error level`

## Environment

Deezer's public API needs **no credentials**, so the app requires no secret to run.
If a future provider needs keys, they go in `.env.local` (gitignored) — never logged,
never exposed to the client bundle. (A pre-spike `.env.local` with Spotify creds may
linger locally; it is unused.)

## Out of scope (MVP)

User accounts, multi-source, free-text activities, full-track streaming (needs a provider playback SDK + user login), LLM-generated content, social features, i18n. See plan file for rationale.

**In scope**: 30s preview playback via the `preview` field on Deezer tracks (public MP3, no login). Deezer populates this reliably (spike: 100% coverage), unlike Spotify. A `null` preview still degrades to a disabled state defensively.

## Reference

- Current sprint tasks + progress: `./ROADMAP.md` (check first to know what's done and what's next)
- Architecture decision log: `./DECISIONS.md` (the _why_ behind non-obvious, contested choices — read before re-litigating a decision)
- Architecture reference: `./ARCHITECTURE.md` (modules, data contracts, data flow, testing strategy, a11y requirements)
- Design system + decisions: `./DESIGN.md` (visual rules, tokens, components, Pencil gotchas, design→code handoff)
- Visual source of truth: `./design/design.pen` (open via Pencil MCP) + `./design/screenshots/` (PNG exports per screen)
- Dev tooling: `./.claude/skills/` (`react-patterns`, `pen-to-component`, `a11y`) + `./.claude/agents/` (`code-reviewer`). Mental model — skills = reusable recipes (invocable by anyone, including agents); agents = isolated-context workers. An agent can call a skill, but not another agent. Accessibility is centralized in the `a11y` skill (spec lives in `ARCHITECTURE.md`).
- Original planning notes: `~/.claude/plans/you-are-a-senior-glimmering-pinwheel.md` (historical, optional)
