import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAttachSliderCallback } from "../../src/Slider/useAttachSliderCallback";
import {
  AudioContext,
  AudioContextType,
} from "../../src/AudioElement/AudioContext";
import { createSliderContext, createAudioContext } from "../testUtils";
import { SliderContextAction } from "../../src/Slider/SliderContext";

const actionContext = createSliderContext({
  value: 0.5,
  sliderStart: 0,
  minValue: 0,
  maxValue: 1,
  step: 0.1,
});
const mockHandleSideEffect = vi.fn();

vi.mock("../../src/AudioElement/useHandleSideEffect", () => ({
  useHandleSideEffect: () => mockHandleSideEffect,
}));

describe("useAttachSliderCallback", () => {
  const createWrapper =
    (contextValue: AudioContextType) =>
    ({ children }: { children: React.ReactNode }) => (
      <AudioContext.Provider value={contextValue}>
        {children}
      </AudioContext.Provider>
    );

  it("attaches timeline callback", () => {
    const dispatch = vi.fn();
    const context = createAudioContext({
      timelineCallbackRef: { current: { handleTimelineAction: vi.fn() } },
      volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
      playbackRateCallbackRef: {
        current: { handlePlaybackRateAction: vi.fn() },
      },
    });

    renderHook(
      () => useAttachSliderCallback({ dispatch, component: "timeline" }),
      { wrapper: createWrapper(context) },
    );

    const action: SliderContextAction = {
      type: "DRAG_START",
      ...actionContext,
    };
    (
      context.timelineCallbackRef.current as {
        handleTimelineAction: (action: SliderContextAction) => void;
      }
    ).handleTimelineAction(action);

    expect(dispatch).toHaveBeenCalledWith(action);
  });

  it("attaches volume callback", () => {
    const dispatch = vi.fn();
    const context = createAudioContext({
      timelineCallbackRef: { current: { handleTimelineAction: vi.fn() } },
      volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
      playbackRateCallbackRef: {
        current: { handlePlaybackRateAction: vi.fn() },
      },
    });

    renderHook(
      () => useAttachSliderCallback({ dispatch, component: "volume" }),
      { wrapper: createWrapper(context) },
    );

    const action: SliderContextAction = {
      type: "DRAG_START",
      ...actionContext,
    };
    (
      context.volumeCallbackRef.current as {
        handleVolumeAction: (action: SliderContextAction) => void;
      }
    ).handleVolumeAction(action);

    expect(dispatch).toHaveBeenCalledWith(action);
  });

  it("attaches playback rate callback", () => {
    const dispatch = vi.fn();
    const context = createAudioContext({
      timelineCallbackRef: { current: { handleTimelineAction: vi.fn() } },
      volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
      playbackRateCallbackRef: {
        current: { handlePlaybackRateAction: vi.fn() },
      },
    });

    renderHook(
      () => useAttachSliderCallback({ dispatch, component: "playbackRate" }),
      { wrapper: createWrapper(context) },
    );

    const action: SliderContextAction = {
      type: "DRAG_START",
      ...actionContext,
    };
    (
      context.playbackRateCallbackRef.current as {
        handlePlaybackRateAction: (action: SliderContextAction) => void;
      }
    ).handlePlaybackRateAction(action);

    expect(dispatch).toHaveBeenCalledWith(action);
  });

  it("handles side effects", () => {
    const dispatch = vi.fn();
    const context = createAudioContext({
      timelineCallbackRef: { current: { handleTimelineAction: vi.fn() } },
      volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
      playbackRateCallbackRef: {
        current: { handlePlaybackRateAction: vi.fn() },
      },
    });

    const { result } = renderHook(
      () =>
        useAttachSliderCallback({ dispatch, component: "timeline" as const }),
      { wrapper: createWrapper(context) },
    );

    const action: SliderContextAction = { type: "DRAG", ...actionContext };
    result.current(action);

    expect(mockHandleSideEffect).toHaveBeenCalledWith(action);
  });

  it("handles missing callback refs", () => {
    const dispatch = vi.fn();
    const context = createAudioContext({
      timelineCallbackRef: { current: { handleTimelineAction: vi.fn() } },
      volumeCallbackRef: { current: { handleVolumeAction: vi.fn() } },
      playbackRateCallbackRef: {
        current: { handlePlaybackRateAction: vi.fn() },
      },
    });

    renderHook(
      () => useAttachSliderCallback({ dispatch, component: "timeline" }),
      { wrapper: createWrapper(context) },
    );

    expect(dispatch).not.toHaveBeenCalled();
  });
});
