import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVolumeAriaAttributes } from "../../src/Volume/volumeHooks";
import { PlayerContext } from "../../src/Player/PlayerContext";
import React from "react";

describe("useVolumeAriaAttributes", () => {
  const createPlayerContext = (overrides = {}) => ({
    getPlayerState: () => ({
      volume: 0.5,
      ...overrides,
    }),
  });

  const createWrapper =
    (contextValue) =>
    ({ children }) => (
      <PlayerContext.Provider value={contextValue}>
        {children}
      </PlayerContext.Provider>
    );

  it("should return correct aria attributes for volume", () => {
    const playerContext = createPlayerContext();
    const { result } = renderHook(() => useVolumeAriaAttributes(), {
      wrapper: createWrapper(playerContext),
    });

    expect(result.current).toEqual({
      "aria-label": "Adjust volume",
      "aria-valuemin": 0,
      "aria-valuemax": 1,
      "aria-valuenow": 0.5,
      "aria-valuetext": "Volume 50%",
    });
  });

  it("should handle volume at 0%", () => {
    const playerContext = createPlayerContext({ volume: 0 });
    const { result } = renderHook(() => useVolumeAriaAttributes(), {
      wrapper: createWrapper(playerContext),
    });

    expect(result.current["aria-valuenow"]).toBe(0);
    expect(result.current["aria-valuetext"]).toBe("Volume 0%");
  });

  it("should handle volume at 100%", () => {
    const playerContext = createPlayerContext({ volume: 1 });
    const { result } = renderHook(() => useVolumeAriaAttributes(), {
      wrapper: createWrapper(playerContext),
    });

    expect(result.current["aria-valuenow"]).toBe(1);
    expect(result.current["aria-valuetext"]).toBe("Volume 100%");
  });

  it("should round volume percentage", () => {
    const playerContext = createPlayerContext({ volume: 0.333 });
    const { result } = renderHook(() => useVolumeAriaAttributes(), {
      wrapper: createWrapper(playerContext),
    });

    expect(result.current["aria-valuenow"]).toBe(0.333);
    expect(result.current["aria-valuetext"]).toBe("Volume 33%");
  });
});
