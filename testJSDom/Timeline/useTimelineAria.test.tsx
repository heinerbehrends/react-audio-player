import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTimelineAriaAttributes } from "../../src/Timeline/useTimelineAria";
import { PlayerContext } from "../../src/Player/PlayerContext";
import React from "react";

describe("useTimelineAriaAttributes", () => {
  const createPlayerContext = (overrides = {}) => ({
    getPlayerState: () => ({
      currentTime: 65,
      duration: 120,
      ...overrides,
    }),
  });

  const createSliderContext = (overrides = {}) => ({
    value: 0.5,
    minValue: 0,
    maxValue: 1,
    orientation: "horizontal" as const,
    component: "timeline" as const,
    clientXY: 0,
    sliderStart: 0,
    sliderLength: 0,
    step: 0,
    dragState: "idle" as const,
    handleSliderAction: vi.fn(),
    ...overrides,
  });

  const createWrapper =
    (playerContext) =>
    ({ children }) => (
      <PlayerContext.Provider value={playerContext}>
        {children}
      </PlayerContext.Provider>
    );

  it("should return correct aria attributes for timeline", () => {
    const playerContext = createPlayerContext();
    const sliderContext = createSliderContext();

    const { result } = renderHook(
      () => useTimelineAriaAttributes(sliderContext),
      { wrapper: createWrapper(playerContext) },
    );

    expect(result.current).toEqual({
      "aria-label": "Timeline slider",
      "aria-valuemin": 0,
      "aria-valuemax": 1,
      "aria-valuenow": 0.5,
      "aria-valuetext": "Position 1:05 of 2:00",
      "aria-orientation": "horizontal",
    });
  });

  it("should return correct aria attributes for volume", () => {
    const playerContext = createPlayerContext();
    const sliderContext = createSliderContext({
      component: "volume" as const,
      value: 0.75,
    });

    const { result } = renderHook(
      () => useTimelineAriaAttributes(sliderContext),
      { wrapper: createWrapper(playerContext) },
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
    const playerContext = createPlayerContext();
    const sliderContext = createSliderContext({
      component: "playbackRate" as const,
      value: 1.5,
    });

    const { result } = renderHook(
      () => useTimelineAriaAttributes(sliderContext),
      { wrapper: createWrapper(playerContext) },
    );

    expect(result.current).toEqual({
      "aria-label": "Playback rate slider",
      "aria-valuemin": 0,
      "aria-valuemax": 1,
      "aria-valuenow": 1.5,
      "aria-valuetext": "1.5x",
      "aria-orientation": "horizontal",
    });
  });

  it("should format time correctly", () => {
    const playerContext = createPlayerContext({
      currentTime: 125,
      duration: 180,
    });
    const sliderContext = createSliderContext();

    const { result } = renderHook(
      () => useTimelineAriaAttributes(sliderContext),
      { wrapper: createWrapper(playerContext) },
    );

    expect(result.current["aria-valuetext"]).toBe("Position 2:05 of 3:00");
  });
});
