import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsDisabled } from "../../src/Shared/useIsDisabled";
import { PlayerContext, PlayerState } from "../../src/Player/PlayerContext";
import React from "react";
import { createPlayerContext } from "../testUtils";

describe("useIsDisabled", () => {
  const createWrapper = (playerState: PlayerState) => {
    const playerContext = createPlayerContext({ overrides: { playerState } });
    return ({ children }: { children: React.ReactNode }) => (
      <PlayerContext.Provider value={playerContext}>
        {children}
      </PlayerContext.Provider>
    );
  };

  it("returns true when player is in loading state", () => {
    const { result } = renderHook(() => useIsDisabled(), {
      wrapper: createWrapper("loading"),
    });
    expect(result.current).toBe(true);
  });

  it("returns true when player is in error state", () => {
    const { result } = renderHook(() => useIsDisabled(), {
      wrapper: createWrapper("error"),
    });
    expect(result.current).toBe(true);
  });

  it("returns false when player is in playing state", () => {
    const { result } = renderHook(() => useIsDisabled(), {
      wrapper: createWrapper("playing"),
    });
    expect(result.current).toBe(false);
  });

  it("returns false when player is in paused state", () => {
    const { result } = renderHook(() => useIsDisabled(), {
      wrapper: createWrapper("paused"),
    });
    expect(result.current).toBe(false);
  });
});
