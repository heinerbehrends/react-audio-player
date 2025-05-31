import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAttachSliderCallback } from "../../src/Slider/useAttachSliderCallback";
import {
  AudioContext,
  AudioContextType,
} from "../../src/AudioElement/AudioContext";
import React from "react";

const actionContext = {
  clientXY: 0,
  sliderStart: 0,
  sliderLength: 100,
  minValue: 0,
  maxValue: 1,
  orientation: "horizontal" as const,
  step: 0.1,
  component: "timeline" as const,
};

describe("useAttachSliderCallback", () => {
  const createAudioContext = (overrides = {}) => ({
    audioElementRef: { current: document.createElement("audio") },
    handleSideEffect: vi.fn(),
    timelineCallbackRef: { current: { handleTimelineAction: vi.fn() } },
    volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
    playbackRateCallbackRef: { current: { handlePlaybackRateAction: vi.fn() } },
    ...overrides,
  });

  const createWrapper =
    (contextValue: AudioContextType) =>
    ({ children }) => (
      <AudioContext.Provider value={contextValue}>
        {children}
      </AudioContext.Provider>
    );

  it("attaches timeline callback", () => {
    const dispatch = vi.fn();
    const context = createAudioContext();

    renderHook(
      () => useAttachSliderCallback({ dispatch, component: "timeline" }),
      { wrapper: createWrapper(context) },
    );

    const action = { type: "DRAG_START" };
    context.timelineCallbackRef.current.handleTimelineAction(action);

    expect(dispatch).toHaveBeenCalledWith(action);
  });

  it("attaches volume callback", () => {
    const dispatch = vi.fn();
    const context = createAudioContext();

    renderHook(
      () => useAttachSliderCallback({ dispatch, component: "volume" }),
      { wrapper: createWrapper(context) },
    );

    const action = { type: "DRAG_START" };
    context.volumeCallbackRef.current.handleVolumeAction(action);

    expect(dispatch).toHaveBeenCalledWith(action);
  });

  it("attaches playback rate callback", () => {
    const dispatch = vi.fn();
    const context = createAudioContext();

    renderHook(
      () => useAttachSliderCallback({ dispatch, component: "playbackRate" }),
      { wrapper: createWrapper(context) },
    );

    const action = { type: "DRAG_START" };
    context.playbackRateCallbackRef.current.handlePlaybackRateAction(action);

    expect(dispatch).toHaveBeenCalledWith(action);
  });

  it("handles side effects", () => {
    const dispatch = vi.fn();
    const context = createAudioContext();

    const { result } = renderHook(
      () =>
        useAttachSliderCallback({ dispatch, component: "timeline" as const }),
      { wrapper: createWrapper(context) },
    );

    const action = { type: "DRAG" as const, ...actionContext };
    result.current(action);

    expect(context.handleSideEffect).toHaveBeenCalledWith(
      action,
      context.audioElementRef.current,
    );
  });

  it("handles missing callback refs", () => {
    const dispatch = vi.fn();
    const context = createAudioContext({
      timelineCallbackRef: { current: null },
      volumeCallbackRef: { current: null },
      playbackRateCallbackRef: { current: null },
    });

    renderHook(
      () => useAttachSliderCallback({ dispatch, component: "timeline" }),
      { wrapper: createWrapper(context) },
    );

    expect(dispatch).not.toHaveBeenCalled();
  });
});
