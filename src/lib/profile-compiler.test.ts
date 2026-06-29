import { describe, expect, it } from "vitest";

import { ACTIVITIES } from "./activity-registry";
import { compileProfile } from "./profile-compiler";
import type { AttributeKey } from "./types";

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "energy",
  "tempo",
  "valence",
  "danceability",
  "acousticness",
];

const snowboard = ACTIVITIES[0];
const coding = ACTIVITIES[3];

describe("profile-compiler", () => {
  describe("determinism", () => {
    it("same (entry, seed) → identical profile", () => {
      const a = compileProfile(snowboard, "abc123");
      const b = compileProfile(snowboard, "abc123");
      expect(a).toEqual(b);
    });

    it("different seeds → different attribute targets for the same entry", () => {
      const a = compileProfile(snowboard, "abc123");
      const b = compileProfile(snowboard, "xyz789");
      const anyDiffers = ATTRIBUTE_KEYS.some(
        (key) => a.attributes[key].target !== b.attributes[key].target,
      );
      expect(anyDiffers).toBe(true);
    });
  });

  describe("bounds", () => {
    const TEST_SEEDS = ["abc", "xyz", "000", "zzz", "a1b2c3"];

    it.each(ACTIVITIES)(
      "$id: jittered targets stay within [min, max] across seeds",
      (entry) => {
        for (const seed of TEST_SEEDS) {
          const profile = compileProfile(entry, seed);
          for (const key of ATTRIBUTE_KEYS) {
            const { min, target, max } = profile.attributes[key];
            expect(
              target,
              `${entry.id}.${key} (seed=${seed}): target ≥ min`,
            ).toBeGreaterThanOrEqual(min);
            expect(
              target,
              `${entry.id}.${key} (seed=${seed}): target ≤ max`,
            ).toBeLessThanOrEqual(max);
          }
        }
      },
    );
  });

  describe("passthrough fields", () => {
    it("copies activityId, seed, poolRef, trackLimit, moodPrimary, namePoolKey from entry", () => {
      const profile = compileProfile(coding, "test-seed");
      expect(profile.activityId).toBe(coding.id);
      expect(profile.seed).toBe("test-seed");
      expect(profile.poolRef).toBe(coding.poolRef);
      expect(profile.trackLimit).toBe(coding.trackLimit);
      expect(profile.moodPrimary).toBe(coding.moodPrimary);
      expect(profile.namePoolKey).toBe(coding.namePoolKey);
    });

    it("preserves min and max from the authored entry", () => {
      const profile = compileProfile(coding, "test-seed");
      for (const key of ATTRIBUTE_KEYS) {
        expect(profile.attributes[key].min).toBe(coding.attributes[key].min);
        expect(profile.attributes[key].max).toBe(coding.attributes[key].max);
      }
    });
  });
});
