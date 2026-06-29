import { hashSeed, makePrng } from "./prng";
import type {
  ActivityProfile,
  Mood,
  NormalizedTrack,
  Tribe,
  TribeItem,
} from "./types";

export const GENERATION_VERSION = "1.0.0";

type MoodData = {
  names: string[];
  tagline: string;
  description: string;
  keywords: string[];
};

// Inline mood data for Sprint 1. Moves to per-activity files in Sprint 2.
const MOOD_DATA: Record<Mood, MoodData> = {
  energetic: {
    names: [
      "Apex Riders",
      "Thunder Pack",
      "Peak Force",
      "Storm Collective",
      "Ignite Crew",
    ],
    tagline: "Full throttle, no brakes.",
    description:
      "This tribe lives at peak intensity — tracks engineered to push you harder and faster. Pure adrenaline, no filler.",
    keywords: ["high-energy", "adrenaline", "fast", "peak", "electric"],
  },
  intense: {
    names: [
      "Iron Wave",
      "Raw Current",
      "Grind Nation",
      "Pressure Drop",
      "Hard Circuit",
    ],
    tagline: "Push past the edge.",
    description:
      "Raw energy, relentless drive. This tribe doesn't ask permission — it just goes.",
    keywords: ["raw", "relentless", "power", "grit", "hard"],
  },
  focused: {
    names: [
      "Deep Focus",
      "Flow State",
      "Zone Collective",
      "Signal Drift",
      "Still Current",
    ],
    tagline: "In the zone, out of time.",
    description:
      "Built for deep work and long sessions. These tracks dissolve the noise and let you lock in.",
    keywords: ["deep work", "flow", "instrumental", "zoned-in", "focus"],
  },
  calm: {
    names: [
      "Drift Society",
      "Soft Current",
      "Easy Wave",
      "Slow Burn Collective",
      "Gentle Tide",
    ],
    tagline: "Breathe. Flow. Repeat.",
    description:
      "No rush, no pressure. A soundtrack for the moments where slow is exactly right.",
    keywords: ["chill", "laid-back", "easy", "mellow", "slow"],
  },
  melancholic: {
    names: [
      "Faded Light",
      "Echo Chamber",
      "Hollow Sound",
      "Dusk Collective",
      "Grey Tide",
    ],
    tagline: "Feel it all.",
    description:
      "For when you need music that actually understands. These tracks sit with you.",
    keywords: ["emotional", "introspective", "moody", "dark", "deep"],
  },
  uplifting: {
    names: [
      "Rise Collective",
      "Bright Wave",
      "Lift Crew",
      "Open Sky",
      "Golden Hour",
    ],
    tagline: "Eyes up. Move forward.",
    description:
      "The kind of music that makes the ordinary feel possible. Forward motion, one track at a time.",
    keywords: ["positive", "inspiring", "bright", "feel-good", "forward"],
  },
};

// Fisher-Yates shuffle — mutates a copy, not the original.
function shuffled<T>(arr: T[], rand: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pure. Deterministic. No I/O, no Math.random().
 * Samples + orders tracks by seed, picks an identity from the mood pool,
 * and assembles the final Tribe.
 */
export function composeTribe(
  profile: ActivityProfile,
  tracks: NormalizedTrack[],
  seed: string,
): Tribe {
  const rand = makePrng(hashSeed(seed));
  const mood = MOOD_DATA[profile.moodPrimary];

  const name = mood.names[Math.floor(rand() * mood.names.length)];

  const items: TribeItem[] = shuffled(tracks, rand)
    .slice(0, profile.trackLimit)
    .map((t) => ({
      trackId: t.id,
      title: t.title,
      artist: t.artists.join(", "),
      album: t.album,
      imageUrl: t.imageUrl,
      durationMs: t.durationMs,
      previewUrl: t.previewUrl,
      externalUrl: t.externalUrl,
    }));

  const attributes = Object.fromEntries(
    (
      Object.keys(profile.attributes) as (keyof typeof profile.attributes)[]
    ).map((key) => [key, profile.attributes[key].target]),
  ) as Tribe["attributes"];

  return {
    id: `${profile.activityId}:${seed}`,
    activityId: profile.activityId,
    activityLabel: profile.label,
    seed,
    generationVersion: GENERATION_VERSION,
    identity: {
      name,
      tagline: mood.tagline,
      description: mood.description,
      icon: profile.icon,
    },
    mood: {
      primary: profile.moodPrimary,
      keywords: mood.keywords,
    },
    attributes,
    items,
  };
}
