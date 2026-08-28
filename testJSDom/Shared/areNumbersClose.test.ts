import { describe, it, expect } from "vitest";
import { areNumbersClose } from "../../src/Shared/areNumbersClose";

describe("areNumbersClose", () => {
  it("returns true for numbers within 0.001 of each other", () => {
    expect(areNumbersClose(1.0001, 1)).toBe(true);
    expect(areNumbersClose(1, 1.0001)).toBe(true);
    expect(areNumbersClose(0.9999, 1)).toBe(true);
  });

  it("returns false for numbers more than 0.001 apart", () => {
    expect(areNumbersClose(1.002, 1)).toBe(false);
    expect(areNumbersClose(1, 1.002)).toBe(false);
    expect(areNumbersClose(0.998, 1)).toBe(false);
  });

  it("handles zero values", () => {
    expect(areNumbersClose(0, 0.0001)).toBe(true);
    expect(areNumbersClose(0, 0.002)).toBe(false);
  });
});
