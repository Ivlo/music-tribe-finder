# Music Tribe Finder — Roadmap

Living plan + task tracker. Check items off as they're completed.
Full architecture detail: `~/.claude/plans/you-are-a-senior-glimmering-pinwheel.md`.

## Status

- [x] Architecture plan approved
- [x] `CLAUDE.md` created
- [x] `ROADMAP.md` created
- [x] `ARCHITECTURE.md` created
- [x] Sprint 0.5 — Design (Pencil `.pen`, tokens, 3 screens × 2 breakpoints, 8 reusable components, `DESIGN.md` rationale)
- [x] Sprint 0 — Foundations (toolchain complete; Vercel relocated to Sprint 1 § Deploy)
- [ ] Sprint 1 — Vertical slice
- [ ] Sprint 2 — Catalog + identity quality
- [ ] Sprint 3 — Production polish

**Currently working on**: _Claude hooks DONE (PostToolUse prettier + blocking Stop lint/typecheck, all paths tested). **Next: pre-commit gate** — pick mechanism (husky / simple-git-hooks / lint-staged / raw) — then Sprint 1._

---

## Locked decisions

> Index only. The _why_ behind consequential decisions lives in `DECISIONS.md`.

- Deezer as track source (editorial playlists + genre charts) — see ADR-002
- Static curated pools, attributes authored, no live audio-features — see ADR-001
- Preset activity list (~20–30 activities, no free text)
- Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel
- No DB, no accounts — tribes reproducible from URL: `/tribe/[activityId]?seed=...`
- Determinism: same `(activityId, seed)` → same tribe byte-for-byte
- Three screens: Home → Generating (`loading.tsx`) → Tribe Result
- WCAG 2.1 AA accessibility from day 1

---

## Sprint 0 — Foundations (~1 day)

> **Blocking spike — DONE (2026-05-29).** Verified empirically that new Spotify
> client_credentials apps can't reach `/recommendations` (404) or `/audio-features`
> (403), and `preview_url` is always `null`. Spiked no-auth alternatives; Deezer won
> a head-to-head vs iTunes. Outcome: **static curated pools + Deezer source + authored
> attributes**. Full rationale in `DECISIONS.md` (ADR-001, ADR-002).

- [x] **Spike**: verify which endpoints a new client ID can reach (`scripts/spotify-spike.sh`)
- [x] **Spike**: head-to-head of no-auth alternatives — iTunes vs Deezer (`scripts/altmusic-headtohead.sh`)
- [x] **Decide the data strategy from the spike result** → ADR-001 + ADR-002 (Deezer, static pools)
- [x] ~~Create Spotify developer app + add creds~~ (done, now unused — Deezer needs no auth)
- [x] Scaffold with `create-next-app@16.2.6` → App Router, TS, ESLint, Tailwind v4, `src/`, `@/*` alias, pnpm
- [x] Verify `eslint-plugin-jsx-a11y` rules are at error level in ESLint config (added plugin as direct dep; re-applied `flatConfigs.strict` rules at error — 31 rules now fail lint, not warn)
- [x] Set up Prettier (+ `eslint-config-prettier` so ESLint and Prettier don't fight) — explicit-defaults `.prettierrc.json`, `.prettierignore`, `format`/`format:check` scripts, prettier config last in ESLint; repo reformatted
- [x] Set up Vitest + React Testing Library + `@testing-library/jest-dom` + `vitest-axe` — jsdom env, `@/` alias, setup file (jest-dom + axe matchers + RTL cleanup), `vitest-axe.d.ts` type shim for Vitest 4, `.d.ts` ESLint override, `test`/`test:watch`/`typecheck` scripts; all 4 gates green
- [x] ~~Link project to Vercel~~ → **moved to Sprint 1 § Deploy** (needs interactive login + something real to deploy; no value before the vertical slice exists)
- [x] Set up CI workflow: `.github/workflows/ci.yml` — lint + typecheck + test + format:check on push/PR to main; Node from `.nvmrc`, pnpm pinned via `packageManager`, `--frozen-lockfile`
- [x] Set up Playwright + `@axe-core/playwright` (config only; tests in Sprint 1) — `playwright.config.ts` (Chromium, `build`+`start` webServer), tests isolated in `e2e/` (Vitest excludes it), `e2e` script w/ `--pass-with-no-tests` until Sprint 1

---

## Dev tooling & hooks (after Sprint 0)

Toolchain (Prettier, Vitest, ESLint) must exist first — these hooks call those commands.

**Claude Code hooks** (`.claude/settings.json`):

- [x] PostToolUse: `prettier --write` on edited `.ts`/`.tsx` (auto-format, non-blocking) — `.claude/hooks/format.sh`, matcher `Edit|Write`, filters extension, always exits 0
- [x] Stop: lint + typecheck only (fast feedback; no tests) — `.claude/hooks/check.sh`, blocks (exit 2) on failure + feeds errors back, `stop_hook_active` loop guard; lint scoped to changed **+ untracked** `.ts/.tsx` (`git diff` misses new files), typecheck whole-project; bash 3.2-safe
- [x] Verify the exact Stop-hook JSON / exit-code schema when installing (decision/reason nesting is finicky) — confirmed against official docs: `stop_hook_active` exists; exit 2 = block + stderr→Claude; shared `lib-node-env.sh` puts nvm Node on PATH (hooks run in a profile-less shell); all 5 paths tested empirically

**Pre-commit gate** (a Git-level hook, not a Claude hook — mechanism TBD: decide at install between husky, `simple-git-hooks`, lint-staged, or raw `.git/hooks/`):

- [ ] pre-commit: lint + typecheck + unit + golden determinism (fast local gate; E2E excluded)

---

## Sprint 1 — Vertical slice (~3–4 days)

### Types & registry

- [ ] Define TypeScript types: `ActivityProfile`, `Tribe`, `TribeItem`, `NormalizedTrack`
- [ ] Build `activity-registry` with 6 activities covering the energy/mood spectrum:
  - Snowboard (high energy, fast tempo, electronic/trap)
  - Skate (high energy, mid-fast tempo, punk/hip-hop)
  - Gym (high energy, high tempo, hype/rap/electronic)
  - Coding (mid energy, mid tempo, instrumental/electronic)
  - Night Focus (low-mid energy, low tempo, ambient/lo-fi)
  - Chill (low energy, slow tempo, acoustic/indie)
  - [ ] Each entry: `id`, `label`, `icon`, Deezer source refs (playlist / genre-chart ids), authored attributes (energy/tempo/valence/…), name-pool key

### Pure modules

- [ ] Implement `profile-compiler`: `(activity, seed) → ActivityProfile`, deterministic
- [ ] Implement `tribe-composer`: `(profile, tracks, seed) → Tribe`, deterministic
- [ ] Unit tests: same inputs → same output; different seeds → different but in-bounds outputs

### Track source (build-time harvest + request-time load)

- [ ] Implement `deezer-harvest` script: fetch each activity's source refs (playlists / genre charts), paginate (`limit≤... `), normalize + dedupe, write `src/data/pools/<poolRef>.json`
- [ ] Implement `track-source`: load committed pool JSON → `NormalizedTrack[]` (local read, no network)
- [ ] Mock-fetch unit tests for harvest normalization/dedupe; fixture-pool test for the loader
- [ ] One optional gated integration test against real Deezer

### React components (1:1 from `.pen` — see `DESIGN.md` §Reusable components)

- [ ] Create the `component-builder` agent (preloads `react-patterns` + `pen-to-component` + `a11y`) — built after the Sprint 0 scaffold exists, used to build the components below in parallel
- [ ] `<ActivityTile />` — radio item; states: default / hover / focused / selected
- [ ] `<PrimaryButton />` — pill CTA; states: default / disabled
- [ ] `<MoodChip />` — single chip from `Tribe.mood.keywords`
- [ ] `<AttributeMeter />` — wraps native `<meter>` + numeric label (never color-alone)
- [ ] `<TrackItem />` — **Client Component**; states: paused / playing / no-preview
  - [ ] Audio playback via `<audio>` + React state; auto-pause previously playing track
  - [ ] `aria-pressed`, `aria-label="Play preview of {title}"`, space key toggles
  - [ ] Graceful "no preview available" state when `previewUrl` is null (`opacity: 0.3`, `cursor: not-allowed`, tooltip)
  - [ ] Secondary "Open in Spotify" link with `external-link` icon, always present
- [ ] `<PhasedMessage />` — cycles 3 messages every ~600ms; respects `prefers-reduced-motion`

### Routes & UI

- [ ] Home page `/`: `<fieldset>` radiogroup with 6 `<ActivityTile />` + `<PrimaryButton />` (disabled until selection)
  - [ ] Keyboard: Tab → arrow keys within tiles → Tab → Generate → Enter
  - [ ] Visible focus rings everywhere
- [ ] `app/tribe/[activityId]/loading.tsx`: `<PhasedMessage />` inside `role="status" aria-live="polite"`
- [ ] `app/tribe/[activityId]/page.tsx`: Server Component, runs pipeline, renders Tribe screen
  - [ ] Identity header (`<h1>`, tagline, description, decorative emoji `aria-hidden="true"`)
  - [ ] Mood keywords row of `<MoodChip />`
  - [ ] 5 `<AttributeMeter />` (Energy, Tempo, Valence, Danceability, Acousticness)
  - [ ] `<ol>` of `<TrackItem />` for 10–20 tracks with album art `alt`
  - [ ] Footer with regenerate `<PrimaryButton />` (mints new seed)

### Tests

- [ ] Playwright smoke test: Home → click tile → click Generate → see Generating → see Tribe with real tracks
- [ ] `@axe-core/playwright` check: zero serious/critical violations on Home, Generating, Tribe

### Deploy

> Moved from Sprint 0: deferred because it needs an interactive Vercel login and a real
> build to deploy. Do it once the vertical slice renders end-to-end.

- [ ] Link project to Vercel (`vercel link` — **interactive login, run by Ivlo**, not Claude)
- [ ] Verify the production build deploys and the 3 screens work on the deployed URL
- [ ] Confirm the build-time Deezer harvest runs in Vercel's build step (pools committed; no request-time API calls)

**Demoable**: pick one of 6 activities, see Generating animation, arrive at a real tribe. Fully keyboard-operable.

---

## Sprint 2 — Catalog + identity quality (~4–5 days)

- [ ] Expand `activity-registry` from 6 → ~20 activities (~14 more to add)
- [ ] Per-activity name pools (10–20 names each)
- [ ] Per-mood description templates (5–10 per mood)
- [ ] Constraint-relaxation fallback in `profile-compiler` for sparse Spotify results
- [ ] "Regenerate" button on Tribe screen (mints new seed, navigates to new URL)
- [ ] Tribe screen UI polish:
  - [ ] Identity header with icon styling
  - [ ] Attribute bars visual polish
  - [ ] Album art rendered with descriptive `alt`
  - [ ] Play/pause button polish: progress indicator (30s ring), nicer "no preview" state
- [ ] Determinism golden-file test in CI (snapshot tribe for fixed inputs, byte-for-byte check)
- [ ] Manual VoiceOver pass on all three screens

**Demoable**: 20 activities, names that don't feel generic, regeneration produces distinct tribes.

---

## Sprint 3 — Production polish (~3–4 days)

- [ ] Error states:
  - [ ] Spotify down / network failure
  - [ ] Unknown activity → graceful 404
  - [ ] Empty results after constraint relaxation
- [ ] Open Graph meta on `/tribe/[id]` for shareable link previews (title, description, album art image)
- [ ] Basic analytics: activity picked, regenerate rate, preview-play rate
- [ ] Vercel edge cache config for `/tribe/[id]` responses
- [ ] Generating screen polish (timings, microcopy)
- [ ] Final accessibility sweep:
  - [ ] Contrast verification with real production colors
  - [ ] Full keyboard pass on all flows
  - [ ] VoiceOver pass on all screens

**Demoable**: feels like a finished product, accessible to every user.

---

## Verification checklist (run before merging changes to composer or compiler)

- [ ] `pnpm typecheck && pnpm lint && pnpm test` is green
- [ ] 3 random activities × 2 seeds — all 6 tribes feel coherent
- [ ] No track in obviously-wrong tribes (metal in "Chill", etc.)
- [ ] Album art loads for ≥80% of items, all with descriptive `alt`
- [ ] No console errors; no axe violations
- [ ] Determinism golden test passes
- [ ] Keyboard-only flow works end-to-end
- [ ] VoiceOver announces the experience meaningfully

---

## Out of MVP (explicitly deferred)

- In-app player (Spotify Web Playback SDK requires user Premium login)
- User accounts / login / profiles
- Saved tribes / personal history
- Multiple sources (Apple Music, YouTube)
- Free-text activity input
- LLM-generated names or descriptions
- Social features (likes, comments, follows)
- Internationalization / RTL

---

## Open questions to revisit after Sprint 1

- How many items per tribe — 10? 15? 20? Decide by feel after seeing real output.
- Item ordering: energy gradient (warm-up → peak → cool-down) or default Spotify order?
- Does the Generating animation need a minimum-display time, or is snap-to-result fine?
- Should `generationVersion` appear in URLs explicitly for shared-link stability across rule changes?
- After MVP: Player screen next, or catalog expansion?
