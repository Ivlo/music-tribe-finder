# Music Tribe Finder

A web MVP that turns an activity (e.g. "Snowboard", "Coding") into a curated
music "tribe": identity, mood/energy attributes, and 10–20 Spotify tracks.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Spotify Web API (client_credentials flow)
- Deployed on Vercel

## Architecture (high level)
Three screens: Home → Generating (`loading.tsx`) → Tribe Result.
All Spotify calls happen server-side. The browser receives fully-rendered HTML.

Core modules (under `src/`):
- `activity-registry` — static catalog of preset activities + rule inputs
- `profile-compiler` — pure: `(activity, seed) → ActivityProfile`
- `spotify-client` — I/O boundary; only place that holds the secret
- `tribe-composer` — pure: `(profile, tracks, seed) → Tribe`
- `app/` — Next.js routes (`/`, `/tribe/[activityId]`)

## Key invariants
- **Determinism**: same `(activityId, seed)` → same tribe, byte-for-byte. The URL is the entire state.
- **No DB, no accounts, no client-side Spotify calls.** `client_secret` lives only in `.env.local` and the server route.
- **No Spotify-specific types leak past `spotify-client`.** Composer takes a normalized `NormalizedTrack[]`.
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
- **Scope** (optional): module name, e.g. `spotify-client`, `profile-compiler`, `tribe-composer`, `activity-registry`, `roadmap`
- **Subject**: imperative, lowercase, no trailing period, ≤72 chars
- **Body** (optional): explain *why*, not *what*. Wrap at 100 chars.
- **Breaking changes**: `!` after type/scope (`feat(spotify-client)!: …`) or `BREAKING CHANGE:` footer

Examples:
- `feat(activity-registry): add skate and gym entries`
- `fix(spotify-client): handle 429 with exponential backoff`
- `docs(roadmap): expand sprint 1 to 6 activities`
- `chore: add eslint jsx-a11y rules at error level`

## Environment
`.env.local` (gitignored) holds `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`. Never log. Never expose to the client bundle.

## Out of scope (MVP)
User accounts, multi-source, free-text activities, in-app player, LLM-generated content, social features, i18n. See plan file for rationale.

## Reference
- Current sprint tasks + progress: `./ROADMAP.md` (check first to know what's done and what's next)
- Architecture reference: `./ARCHITECTURE.md` (modules, data contracts, data flow, testing strategy, a11y requirements)
- Original planning notes: `~/.claude/plans/you-are-a-senior-glimmering-pinwheel.md` (historical, optional)
