import { afterEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  isVolumeAvailable,
  resetVolumeProbe,
  useIsVolumeAvailable,
} from "../../src/store/volumeAvailable";

const volume = Object.getOwnPropertyDescriptor(
  HTMLMediaElement.prototype,
  "volume",
);
if (!volume) throw new Error("jsdom no longer defines volume on the prototype");

/** iOS: the setter is accepted and ignored, and the getter reads `1`. */
function stubReadOnlyVolume() {
  Object.defineProperty(HTMLMediaElement.prototype, "volume", {
    configurable: true,
    get: () => 1,
    set() {},
  });
}

afterEach(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "volume", volume);
  resetVolumeProbe();
});

describe("isVolumeAvailable", () => {
  it("is true where a volume write sticks", () => {
    expect(isVolumeAvailable()).toBe(true);
  });

  it("is false where the write is ignored", () => {
    stubReadOnlyVolume();
    expect(isVolumeAvailable()).toBe(false);
  });

  // One element per page, not one per render: the answer cannot change.
  it("probes once", () => {
    expect(isVolumeAvailable()).toBe(true);
    stubReadOnlyVolume();
    expect(isVolumeAvailable()).toBe(true);
  });
});

describe("useIsVolumeAvailable", () => {
  it("reports the probe, and needs no player around it", () => {
    stubReadOnlyVolume();
    const { result } = renderHook(useIsVolumeAvailable);
    expect(result.current).toBe(false);
  });
});
