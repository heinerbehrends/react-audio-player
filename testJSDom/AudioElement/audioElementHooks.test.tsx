import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useHandleTimeUpdate,
  useHandleVolumeChange,
  usePlayerCallbacks,
  useHandlePlaybackRateChange,
} from "../../src/AudioElement/audioElementHooks";
import { createAudioContext, createMockAudioElement } from "../testUtils";
import { createContextWrapper } from "../testComponents";

describe("audioElementHooks", () => {
  let mockAudioElement: HTMLAudioElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioElement = createMockAudioElement() as HTMLAudioElement;
  });

  describe("useHandleTimeUpdate", () => {
    it("should call timelineCallbackRef handler with current time", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: mockAudioElement },
      });
      const wrapper = createContextWrapper({ audioContext });
      const { result } = renderHook(() => useHandleTimeUpdate(), { wrapper });

      result.current();

      expect(
        audioContext.timelineCallbackRef.current.handleTimelineAction,
      ).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 10,
        component: "timeline",
      });
    });

    it("should handle null audioElement", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: null },
      });
      const wrapper = createContextWrapper({ audioContext });
      const { result } = renderHook(() => useHandleTimeUpdate(), { wrapper });

      result.current();

      expect(
        audioContext.timelineCallbackRef.current.handleTimelineAction,
      ).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0,
        component: "timeline",
      });
    });

    it("should not call timelineCallbackRef handler when it's null", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: mockAudioElement },
        timelineCallbackRef: {
          current: { handleTimelineAction: null },
        },
      });
      const wrapper = createContextWrapper({ audioContext });

      const { result } = renderHook(() => useHandleTimeUpdate(), { wrapper });
      result.current();

      expect(
        audioContext.timelineCallbackRef.current.handleTimelineAction,
      ).toBeNull();
    });
  });

  describe("useHandleVolumeChange", () => {
    // What survives: the slider's UI value. The volume *state* — including the
    // near-zero mute rule — is `useVolumeState`'s, and is covered there.
    it("pushes the element's volume to the volume slider", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: { ...mockAudioElement, volume: 0.8 } },
      });
      const wrapper = createContextWrapper({ audioContext });
      const { result } = renderHook(() => useHandleVolumeChange(), { wrapper });

      result.current();

      expect(
        audioContext.volumeCallbackRef.current.handleVolumeAction,
      ).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0.8,
        component: "volume",
      });
    });

    it("pushes a near-zero volume unchanged, rather than snapping it to 0", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: { ...mockAudioElement, volume: 0.001 } },
      });
      const wrapper = createContextWrapper({ audioContext });
      const { result } = renderHook(() => useHandleVolumeChange(), { wrapper });

      result.current();

      expect(
        audioContext.volumeCallbackRef.current.handleVolumeAction,
      ).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0.001,
        component: "volume",
      });
    });
  });

  describe("usePlayerCallbacks", () => {
    // Three members, down from five: `handleError` and `handlePlayPause` were
    // pure `PlayerContext` dispatches, and the sync layer already projects
    // `error` and `paused` off the element.
    it("exposes exactly the three surviving members", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: mockAudioElement },
      });
      const wrapper = createContextWrapper({ audioContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      expect(Object.keys(result.current).sort()).toEqual([
        "handleDurationChange",
        "handleEnded",
        "handleLoadedMetadata",
      ]);
    });

    it("returns the timeline thumb to the start on handleEnded", () => {
      const mockTimelineAction = vi.fn();
      const audioContext = createAudioContext({
        audioElementRef: { current: mockAudioElement },
      });
      const wrapper = createContextWrapper({ audioContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handleEnded(mockTimelineAction);

      expect(mockTimelineAction).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0,
        component: "timeline",
      });
    });

    it("sets the timeline max value on handleLoadedMetadata", () => {
      const mockTimelineAction = vi.fn();
      const audioContext = createAudioContext({
        audioElementRef: { current: mockAudioElement },
      });
      const wrapper = createContextWrapper({ audioContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handleLoadedMetadata(mockTimelineAction);

      expect(mockTimelineAction).toHaveBeenCalledWith({
        type: "SET_MAX_VALUE",
        maxValue: 100,
      });
    });

    it("should handle null handleTimelineAction in handleLoadedMetadata", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: mockAudioElement },
      });
      const wrapper = createContextWrapper({ audioContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      expect(() => result.current.handleLoadedMetadata(null)).not.toThrow();
    });

    it("should handle null audio element in handleLoadedMetadata", () => {
      const mockTimelineAction = vi.fn();
      const audioContext = createAudioContext({
        audioElementRef: { current: null },
      });
      const wrapper = createContextWrapper({ audioContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handleLoadedMetadata(mockTimelineAction);

      expect(mockTimelineAction).toHaveBeenCalledWith({
        type: "SET_MAX_VALUE",
        maxValue: 1,
      });
    });

    it("sets the timeline max value on handleDurationChange", () => {
      const mockTimelineAction = vi.fn();
      const audioContext = createAudioContext({
        audioElementRef: { current: { ...mockAudioElement, duration: 180.75 } },
      });
      const wrapper = createContextWrapper({ audioContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handleDurationChange(mockTimelineAction);

      expect(mockTimelineAction).toHaveBeenCalledWith({
        type: "SET_MAX_VALUE",
        maxValue: 180.75,
      });
    });
  });

  describe("useHandlePlaybackRateChange", () => {
    it("should update UI value", () => {
      mockAudioElement = {
        playbackRate: 1.5,
      } as HTMLAudioElement;
      const audioContext = createAudioContext({
        audioElementRef: {
          current: mockAudioElement,
        },
      });
      const wrapper = createContextWrapper({ audioContext });

      const { result } = renderHook(() => useHandlePlaybackRateChange(), {
        wrapper,
      });

      result.current();

      expect(
        audioContext.playbackRateCallbackRef.current.handlePlaybackRateAction,
      ).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 1.5,
        component: "playbackRate",
      });
    });
  });
});
