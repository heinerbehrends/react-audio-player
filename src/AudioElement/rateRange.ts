/** A playback-rate range, as the store holds it. */
export type RateRange = { minValue: number; maxValue: number };

/**
 * The widest `rateRange` a player may have: the range that stays audible in
 * both engines. Outside it Firefox keeps playing at the requested speed with
 * the sound cut, below 0.125 and above 8; Chromium is audible up to 16 and
 * throws past it. Measured in Chromium 151 and Firefox 153, 2026-10-05 (C14).
 * Safari is unmeasured.
 */
export const RATE_LIMITS: RateRange = { minValue: 0.125, maxValue: 8 };

/**
 * The `rateRange` without the prop, narrower than `RATE_LIMITS` so that 1x
 * sits near the middle of `<PlaybackRateSlider>`'s track. One range per
 * player: every rate write clamps to it, so no control can reach a rate
 * another one cannot, and a step never has to decide which way "back into
 * range" is (F15).
 *
 * The other two sliders need no equivalent: volume's 0–1 is the browser's own
 * range, and the timeline's ceiling is the duration.
 */
export const DEFAULT_RATE_RANGE: RateRange = { minValue: 0.5, maxValue: 4 };

const clamp = (value: number, { minValue, maxValue }: RateRange) =>
  Math.min(Math.max(value, minValue), maxValue);

/**
 * The `rateRange` prop as the store holds it: each end clamped to
 * `RATE_LIMITS`, and the top never below the bottom. A non-finite end falls
 * back to the default, since `NaN` has no meaningful clamp.
 */
export function normalizeRateRange(
  range: readonly [number, number] | undefined,
): RateRange {
  if (!range || !Number.isFinite(range[0]) || !Number.isFinite(range[1])) {
    return DEFAULT_RATE_RANGE;
  }
  const minValue = clamp(range[0], RATE_LIMITS);
  return {
    minValue,
    maxValue: Math.max(clamp(range[1], RATE_LIMITS), minValue),
  };
}
