import { describe, expect, it } from "vitest";

import { ACTIVITIES, getActivity } from "./activity-registry";
import type { AttributeKey, Mood } from "./types";

const VALID_MOODS: Mood[] = [
  "energetic",
  "focused",
  "calm",
  "melancholic",
  "uplifting",
  "intense",
];

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "energy",
  "tempo",
  "valence",
  "danceability",
  "acousticness",
];

const EXPECTED_IDS = [
  "snowboard",
  "skate",
  "gym",
  "coding",
  "night-focus",
  "chill",
];

describe("activity-registry", () => {
  it("contains exactly the 6 expected activities in order", () => {
    expect(ACTIVITIES.map((a) => a.id)).toEqual(EXPECTED_IDS);
  });

  it("has unique ids", () => {
    const ids = ACTIVITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ACTIVITIES)("$id: moodPrimary is a valid Mood", ({ moodPrimary }) => {
    expect(VALID_MOODS).toContain(moodPrimary);
  });

  it.each(ACTIVITIES)(
    "$id: trackLimit is within the allowed range [10, 20]",
    ({ trackLimit }) => {
      expect(trackLimit).toBeGreaterThanOrEqual(10);
      expect(trackLimit).toBeLessThanOrEqual(20);
    },
  );

  it.each(ACTIVITIES)(
    "$id: attribute ranges are coherent (min ≤ target ≤ max)",
    ({ id, attributes }) => {
      for (const key of ATTRIBUTE_KEYS) {
        const { min, target, max } = attributes[key];
        expect(min, `${id}.${key}: min ≤ max`).toBeLessThanOrEqual(max);
        expect(target, `${id}.${key}: target ≥ min`).toBeGreaterThanOrEqual(
          min,
        );
        expect(target, `${id}.${key}: target ≤ max`).toBeLessThanOrEqual(max);
      }
    },
  );

  it("getActivity returns the entry for a known id", () => {
    const entry = getActivity("coding");
    expect(entry).toBeDefined();
    expect(entry!.id).toBe("coding");
  });

  it("getActivity returns undefined for an unknown id", () => {
    expect(getActivity("not-an-activity")).toBeUndefined();
  });
});
