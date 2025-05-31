import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useHandleDragStart,
  useHandleDrag,
  useHandleDragEnd,
  useOnPointerCancel,
  useSetValue,
} from "../../src/Slider/dragHooks";
import { PlayerContext } from "../../src/Player/PlayerContext";
import React, { type PointerEvent } from "react";

describe("dragHooks", () => {
  const createSliderContext = (overrides = {}) => ({
    value: 0.5,
    minValue: 0,
    maxValue: 1,
    step: 0.1,
    orientation: "horizontal" as const,
    sliderLength: 100,
    sliderStart: 0,
    clientXY: 50,
    dragState: "idle" as const,
    component: "timeline" as const,
    handleSliderAction: vi.fn(),
    offsetFromMiddle: 0,
    ...overrides,
  });

  const createPlayerContext = (overrides = {}) => ({
    handlePlayerAction: vi.fn(),
    playerState: "paused" as const,
    showCaptions: false,
    isMuted: false,
    isPlaying: false,
    playbackRate: 1,
    volumeState: "high" as const,
    timeDisplay: "elapsed" as const,
    audioFiles: [],
    cues: [],
    unmuteVolumeRef: { current: 0 },
    getPlayerState: () => ({
      handlePlayerAction: vi.fn(),
      playerState: "high" as const,
      showCaptions: false,
      isMuted: false,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      volume: 0.5,
      playbackRate: 1,
      volumeState: "high" as const,
      unmuteVolumeRef: { current: 0 },
      ...overrides,
    }),
  });

  describe("useHandleDragStart", () => {
    it("handles drag start for timeline", () => {
      const context = createSliderContext();
      const { result } = renderHook(() => useHandleDragStart(context), {
        wrapper: ({ children }) => (
          <PlayerContext.Provider value={createPlayerContext()}>
            {children}
          </PlayerContext.Provider>
        ),
      });

      const event = {
        clientX: 50,
        clientY: 0,
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "DRAG_START",
        ...context,
        clientXY: 50,
      });
    });

    it("handles drag start for volume slider", () => {
      const context = createSliderContext({ component: "volume" });
      const unmuteVolumeRef = { current: 0.5 };
      const { result } = renderHook(() => useHandleDragStart(context), {
        wrapper: ({ children }) => (
          <PlayerContext.Provider
            value={createPlayerContext({ unmuteVolumeRef })}
          >
            {children}
          </PlayerContext.Provider>
        ),
      });

      const event = {
        clientX: 50,
        clientY: 0,
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(unmuteVolumeRef.current).toBe(0.5);
      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "DRAG_START",
        ...context,
        clientXY: 50,
      });
    });
  });

  describe("useHandleDrag", () => {
    it("handles drag when in dragging state", () => {
      const context = createSliderContext({ dragState: "dragging" });
      const { result } = renderHook(() => useHandleDrag(context));

      const event = {
        clientX: 60,
        clientY: 0,
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "DRAG",
        ...context,
        clientXY: 60,
      });
    });

    it("does not handle drag when not in dragging state", () => {
      const context = createSliderContext({ dragState: "idle" });
      const { result } = renderHook(() => useHandleDrag(context));

      const event = {
        clientX: 60,
        clientY: 0,
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(context.handleSliderAction).not.toHaveBeenCalled();
    });
  });

  describe("useHandleDragEnd", () => {
    it("handles drag end", () => {
      const context = createSliderContext();
      const { result } = renderHook(() => useHandleDragEnd(context));

      const event = {
        clientX: 60,
        clientY: 0,
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "DRAG_END",
        ...context,
        clientXY: 60,
      });
    });
  });

  describe("useOnPointerCancel", () => {
    it("handles pointer cancel", () => {
      const context = createSliderContext();
      const { result } = renderHook(() => useOnPointerCancel(context));

      result.current();

      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "CANCEL_DRAG",
      });
    });
  });

  describe("useSetValue", () => {
    it("sets slider value", () => {
      const context = createSliderContext();
      const { result } = renderHook(() => useSetValue(context));

      const event = {
        clientX: 60,
        clientY: 0,
      } as PointerEvent<HTMLButtonElement>;
      result.current(event);

      expect(context.handleSliderAction).toHaveBeenCalledWith({
        type: "SET_SLIDER_VALUE",
        ...context,
        clientXY: 60,
      });
    });
  });
});
