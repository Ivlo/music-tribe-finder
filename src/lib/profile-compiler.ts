import { hashSeed, makePrng } from "./prng";
import type { ActivityEntry, ActivityProfile, AttributeKey } from "./types";

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "energy",
  "tempo",
  "valence",
  "danceability",
  "acousticness",
];

/**
 * Pure. Deterministic. No I/O, no Math.random().
 * Takes the authored registry entry + URL seed and produces an ActivityProfile
 * where each attribute target is seed-jittered within [min, max].
 */
export function compileProfile(
  entry: ActivityEntry,
  seed: string,
): ActivityProfile {
  const rand = makePrng(hashSeed(seed));

  const attributes = Object.fromEntries(
    ATTRIBUTE_KEYS.map((key) => {
      const { min, max } = entry.attributes[key];
      const target = Math.round(min + rand() * (max - min));
      return [key, { min, max, target }];
    }),
  ) as ActivityProfile["attributes"];

  return {
    activityId: entry.id,
    label: entry.label,
    icon: entry.icon,
    seed,
    attributes,
    poolRef: entry.poolRef,
    trackLimit: entry.trackLimit,
    moodPrimary: entry.moodPrimary,
    namePoolKey: entry.namePoolKey,
  };
}
