// Deterministic "credit score" generation.
//
// Until a real bureau integration exists, every user gets a stable pseudo-random
// score derived from a seed (their email). The same seed always yields the same
// score, so re-checking never changes it — no storage required, and it stays
// consistent across the success screen and any future dashboard.

export const SCORE_MIN = 530;
export const SCORE_MAX = 670;

export const BUREAUS = ["Equifax", "Experian", "TransUnion"] as const;
export type Bureau = (typeof BUREAUS)[number];

/** FNV-1a 32-bit hash — small, fast, deterministic, no deps. */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function scoreFromSeed(seed: string, min = SCORE_MIN, max = SCORE_MAX): number {
  return min + (hashString(seed) % (max - min + 1));
}

export type BureauScore = { bureau: Bureau; score: number };

export type CreditProfile = {
  /** Headline score (Equifax, to match the dashboard). */
  primary: number;
  bureaus: BureauScore[];
};

export type Rating = { label: string; color: string };

/** Matches the bands used by CreditGauge. */
export function ratingFor(score: number): Rating {
  if (score < 580) return { label: "Poor", color: "var(--color-meter-poor)" };
  if (score < 670) return { label: "Fair", color: "var(--color-meter-fair)" };
  if (score < 740) return { label: "Good", color: "var(--color-meter-good)" };
  if (score < 800)
    return { label: "Very Good", color: "var(--color-meter-great)" };
  return { label: "Excellent", color: "var(--color-meter-excellent)" };
}

/**
 * Build a stable credit profile for a seed (normally the buyer's email).
 * Each bureau gets its own deterministic score within range.
 */
export function creditProfileFor(
  rawSeed: string | null | undefined,
): CreditProfile {
  const seed = rawSeed?.trim().toLowerCase() || "guest";
  const bureaus: BureauScore[] = BUREAUS.map((bureau) => ({
    bureau,
    score: scoreFromSeed(`${seed}:${bureau}`),
  }));
  return { primary: bureaus[0].score, bureaus };
}
