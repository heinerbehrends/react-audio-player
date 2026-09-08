import { describe, it, expect } from "vitest";
import { formatTime } from "../../src/Shared/formatTime";

describe("formatTime", () => {
  it.each([
    [0, "0:00"],
    [65, "1:05"],
    [120, "2:00"],
    [121, "2:01"],
    [3599, "59:59"],
    [3600, "1:00:00"],
    [3661, "1:01:01"],
    [7325, "2:02:05"],
  ])("formats %i as %s", (input, expected) => {
    expect(formatTime(input)).toBe(expected);
  });

  // One clamp covers all three: reachable from a live stream, from a corrupt
  // file, from `duration` before metadata, and from `duration - currentSecond`
  // while duration is still `NaN`.
  it.each([
    [-5, "0:00"],
    [NaN, "0:00"],
    [Infinity, "0:00"],
    [-Infinity, "0:00"],
  ])("renders %p as %s rather than garbage", (input, expected) => {
    expect(formatTime(input)).toBe(expected);
  });
});
