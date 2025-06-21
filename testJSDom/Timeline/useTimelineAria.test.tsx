import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTimelineAriaAttributes } from "../../src/Timeline/useTimelineAria";
import {
  PlayerContext,
  PlayerContextType,
} from "../../src/Player/PlayerContext";
import { createPlayerContext, createSliderContext } from "../testUtils";

const defaultSliderContext = createSliderContext({
  component: "timeline" as const,
  value: 1.5,
  minValue: 0.5,
  maxValue: 4,
  orientation: "horizontal" as const,
});

const mockAudioElement = {
  currentTime: 65,
  duration: 120,
} as unknown as HTMLAudioElement;

vi.mock("../../src/AudioElement/useAudioElement", () => ({
  useAudioElement: () => mockAudioElement,
}));

const defaultPlayerContext = createPlayerContext();

describe("useTimelineAriaAttributes", () => {
  const createWrapper =
    (playerContext: PlayerContextType) =>
    ({ children }: { children: React.ReactNode }) => (
      <PlayerContext.Provider value={playerContext}>
        {children}
      </PlayerContext.Provider>
    );

  it("should return correct aria attributes for timeline", () => {
    const { result } = renderHook(
      () => useTimelineAriaAttributes(defaultSliderContext),
      { wrapper: createWrapper(defaultPlayerContext) },
    );

    expect(result.current).toEqual({
      "aria-label": "Timeline slider",
      "aria-valuemin": 0.5,
      "aria-valuemax": 4,
      "aria-valuenow": 1.5,
      "aria-valuetext": "Position 1:05 of 2:00",
      "aria-orientation": "horizontal",
    });
  });

  it("should return correct aria attributes for volume", () => {
    const { result } = renderHook(
      () =>
        useTimelineAriaAttributes({
          ...defaultSliderContext,
          value: 0.75,
          minValue: 0,
          maxValue: 1,
          component: "volume" as const,
        }),
      { wrapper: createWrapper(defaultPlayerContext) },
    );

    expect(result.current).toEqual({
      "aria-label": "Volume slider",
      "aria-valuemin": 0,
      "aria-valuemax": 1,
      "aria-valuenow": 0.75,
      "aria-valuetext": "75%",
      "aria-orientation": "horizontal",
    });
  });

  it("should return correct aria attributes for playback rate", () => {
    const { result } = renderHook(
      () =>
        useTimelineAriaAttributes({
          ...defaultSliderContext,
          value: 1.5,
          component: "playbackRate" as const,
        }),
      { wrapper: createWrapper(defaultPlayerContext) },
    );

    expect(result.current).toEqual({
      "aria-label": "Playback rate slider",
      "aria-valuemin": 0.5,
      "aria-valuemax": 4,
      "aria-valuenow": 1.5,
      "aria-valuetext": "1.5x",
      "aria-orientation": "horizontal",
    });
  });
});
