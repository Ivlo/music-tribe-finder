// The static catalog of preset activities. Hand-authored rule inputs — the only
// place a human defines what a tribe is made of. Three modules read from here:
// web-ui (label/icon), deezer-harvest (sources), profile-compiler (the rest).
//
// Source refs are placeholders for now (kind is real per ADR-002: charts for
// genre-driven activities, playlists for mood-driven ones); the real Deezer ids
// get filled in when we build deezer-harvest. See ARCHITECTURE.md §Modules.

import type { ActivityEntry } from "./types";

/**
 * Ordered list — Home renders the tiles in this order. Spans the energy/mood
 * spectrum from peak-energy (Snowboard) down to low-energy (Chill).
 * Attribute values: 0–100, except `tempo` which is BPM.
 */
export const ACTIVITIES: ActivityEntry[] = [
  {
    id: "snowboard",
    label: "Snowboard",
    icon: "🏂",
    sources: [{ kind: "chart", genreId: "TODO-electronic" }],
    poolRef: "snowboard",
    attributes: {
      energy: { min: 75, max: 95, target: 85 },
      tempo: { min: 128, max: 150, target: 140 },
      valence: { min: 55, max: 80, target: 68 },
      danceability: { min: 65, max: 85, target: 75 },
      acousticness: { min: 5, max: 20, target: 10 },
    },
    moodPrimary: "energetic",
    namePoolKey: "snow-riders",
    trackLimit: 16,
  },
  {
    id: "skate",
    label: "Skate",
    icon: "🛹",
    sources: [
      { kind: "chart", genreId: "TODO-punk" },
      { kind: "chart", genreId: "TODO-hiphop" },
    ],
    poolRef: "skate",
    attributes: {
      energy: { min: 70, max: 90, target: 80 },
      tempo: { min: 110, max: 140, target: 125 },
      valence: { min: 45, max: 70, target: 58 },
      danceability: { min: 55, max: 78, target: 66 },
      acousticness: { min: 5, max: 25, target: 12 },
    },
    moodPrimary: "intense",
    namePoolKey: "street-skaters",
    trackLimit: 16,
  },
  {
    id: "gym",
    label: "Gym",
    icon: "🏋️",
    sources: [{ kind: "chart", genreId: "TODO-rap" }],
    poolRef: "gym",
    attributes: {
      energy: { min: 80, max: 100, target: 92 },
      tempo: { min: 120, max: 145, target: 132 },
      valence: { min: 50, max: 75, target: 62 },
      danceability: { min: 70, max: 90, target: 80 },
      acousticness: { min: 0, max: 15, target: 6 },
    },
    moodPrimary: "intense",
    namePoolKey: "iron-temple",
    trackLimit: 20,
  },
  {
    id: "coding",
    label: "Coding",
    icon: "💻",
    sources: [{ kind: "playlist", id: "TODO-focus-instrumental" }],
    poolRef: "coding",
    attributes: {
      energy: { min: 40, max: 65, target: 52 },
      tempo: { min: 100, max: 125, target: 112 },
      valence: { min: 40, max: 65, target: 52 },
      danceability: { min: 45, max: 65, target: 55 },
      acousticness: { min: 15, max: 40, target: 25 },
    },
    moodPrimary: "focused",
    namePoolKey: "code-flow",
    trackLimit: 18,
  },
  {
    id: "night-focus",
    label: "Night Focus",
    icon: "🌙",
    sources: [{ kind: "playlist", id: "TODO-ambient-lofi" }],
    poolRef: "night-focus",
    attributes: {
      energy: { min: 25, max: 50, target: 38 },
      tempo: { min: 70, max: 100, target: 85 },
      valence: { min: 30, max: 55, target: 42 },
      danceability: { min: 30, max: 55, target: 42 },
      acousticness: { min: 40, max: 70, target: 55 },
    },
    moodPrimary: "focused",
    namePoolKey: "night-owls",
    trackLimit: 16,
  },
  {
    id: "chill",
    label: "Chill",
    icon: "🍃",
    sources: [{ kind: "playlist", id: "TODO-acoustic-indie" }],
    poolRef: "chill",
    attributes: {
      energy: { min: 15, max: 40, target: 28 },
      tempo: { min: 60, max: 90, target: 75 },
      valence: { min: 40, max: 65, target: 52 },
      danceability: { min: 30, max: 55, target: 42 },
      acousticness: { min: 55, max: 85, target: 70 },
    },
    moodPrimary: "calm",
    namePoolKey: "calm-souls",
    trackLimit: 12,
  },
];

/** Lookup by id for the `/tribe/[activityId]` route. Unknown id → undefined → 404. */
export function getActivity(id: string): ActivityEntry | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}
