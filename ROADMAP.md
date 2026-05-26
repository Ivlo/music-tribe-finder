# Music Tribe Finder — Roadmap

Living plan + task tracker. Check items off as they're completed.
Full architecture detail: `~/.claude/plans/you-are-a-senior-glimmering-pinwheel.md`.

## Status

- [x] Architecture plan approved
- [x] `CLAUDE.md` created
- [x] `ROADMAP.md` created
- [x] `ARCHITECTURE.md` created
- [x] Sprint 0.5 — Design (Pencil `.pen`, tokens, 3 screens × 2 breakpoints, 8 reusable components, `DESIGN.md` rationale)
- [ ] Sprint 0 — Foundations
- [ ] Sprint 1 — Vertical slice
- [ ] Sprint 2 — Catalog + identity quality
- [ ] Sprint 3 — Production polish

**Currently working on**: _Sprint 0 — Foundations (not started)_

---

## Locked decisions

- Spotify tracks only (client_credentials flow, secret server-side)
- Preset activity list (~20–30 activities, no free text)
- Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel
- No DB, no accounts — tribes reproducible from URL: `/tribe/[activityId]?seed=...`
- Determinism: same `(activityId, seed)` → same tribe byte-for-byte
- Three screens: Home → Generating (`loading.tsx`) → Tribe Result
- WCAG 2.1 AA accessibility from day 1

---

## Sprint 0 — Foundations (~1 day)

- [ ] Run `npx create-next-app@latest` → App Router, TypeScript, ESLint, Tailwind enabled, `src/` directory yes
- [ ] Verify `eslint-plugin-jsx-a11y` rules are at error level in ESLint config
- [ ] Create Spotify developer app at https://developer.spotify.com/dashboard
- [ ] Add `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` to `.env.local` (add to `.gitignore` if not already)
- [ ] Verify `/v1/recommendations` works for this client ID; if not, switch to `/v1/search` + `/v1/audio-features` fallback now
- [ ] Link project to Vercel
- [ ] Set up CI workflow: `pnpm lint && pnpm typecheck && pnpm test`
- [ ] Set up Playwright + `@axe-core/playwright` (config only; tests in Sprint 1)

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
  - [ ] Each entry: `id`, `label`, `icon`, seed genres, target audio features, name-pool key

### Pure modules
- [ ] Implement `profile-compiler`: `(activity, seed) → ActivityProfile`, deterministic
- [ ] Implement `tribe-composer`: `(profile, tracks, seed) → Tribe`, deterministic
- [ ] Unit tests: same inputs → same output; different seeds → different but in-bounds outputs

### I/O module
- [ ] Implement `spotify-client`: token cache (~1h), call `/recommendations` or fallback, normalize to `NormalizedTrack[]`
- [ ] Mock fetch unit tests for normalization + token caching
- [ ] One optional gated integration test against real Spotify

### React components (1:1 from `.pen` — see `DESIGN.md` §Reusable components)
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
