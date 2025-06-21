import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVolumeAriaAttributes } from "../../src/Volume/volumeHooks";
import {
  PlayerContext,
  PlayerContextType,
} from "../../src/Player/PlayerContext";
import { createPlayerContext } from "../testUtils";

let mockAudioElement = {
  volume: 0.5,
} as unknown as HTMLAudioElement;

vi.mock("../../src/AudioElement/useAudioElement", () => ({
  useAudioElement: () => mockAudioElement,
}));

describe("useVolumeAriaAttributes", () => {
  const createWrapper =
    (contextValue: PlayerContextType) =>
    ({ children }: { children: React.ReactNode }) => (
      <PlayerContext.Provider value={contextValue}>
        {children}
      </PlayerContext.Provider>
    );

  it("should return correct aria attributes for volume", () => {
    mockAudioElement = { volume: 0.5 } as unknown as HTMLAudioElement;
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
    mockAudioElement = { volume: 0 } as unknown as HTMLAudioElement;
    const playerContext = createPlayerContext();
    const { result } = renderHook(() => useVolumeAriaAttributes(), {
      wrapper: createWrapper(playerContext),
    });

    expect(result.current["aria-valuenow"]).toBe(0);
    expect(result.current["aria-valuetext"]).toBe("Volume 0%");
  });

  it("should handle volume at 100%", () => {
    mockAudioElement = { volume: 1 } as unknown as HTMLAudioElement;
    const playerContext = createPlayerContext();
    const { result } = renderHook(() => useVolumeAriaAttributes(), {
      wrapper: createWrapper(playerContext),
    });

    expect(result.current["aria-valuenow"]).toBe(1);
    expect(result.current["aria-valuetext"]).toBe("Volume 100%");
  });

  it("should round volume percentage", () => {
    mockAudioElement = { volume: 0.333 } as unknown as HTMLAudioElement;
    const playerContext = createPlayerContext();
    const { result } = renderHook(() => useVolumeAriaAttributes(), {
      wrapper: createWrapper(playerContext),
    });

    expect(result.current["aria-valuenow"]).toBe(0.333);
    expect(result.current["aria-valuetext"]).toBe("Volume 33%");
  });
});
