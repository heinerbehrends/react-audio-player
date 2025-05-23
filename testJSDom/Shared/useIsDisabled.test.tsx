import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsDisabled } from "../../src/Shared/useIsDisabled";
import { PlayerContext, PlayerState } from "../../src/Player/PlayerContext";
import React from "react";

describe("useIsDisabled", () => {
  const createWrapper = (playerState: PlayerState) => {
    return ({ children }: { children: React.ReactNode }) => (
      <PlayerContext.Provider
        value={{
          playerState,
          handlePlayerAction: vi.fn(),
          getPlayerState: vi.fn(),
          playbackRate: 1,
          volumeState: "high" as const,
          showCaptions: false,
          isMuted: false,
          timeDisplay: "elapsed" as const,
          audioFiles: [],
          cues: [],
          unmuteVolumeRef: { current: 0.7 },
        }}
      >
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
