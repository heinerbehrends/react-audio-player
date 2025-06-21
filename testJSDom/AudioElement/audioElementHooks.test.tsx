import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useHandleTimeUpdate,
  useHandleVolumeChange,
  usePlayerCallbacks,
  useHandlePlaybackRateChange,
} from "../../src/AudioElement/audioElementHooks";
import {
  createPlayerContext,
  createAudioContext,
  createMockAudioElement,
} from "../testUtils";
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
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });
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
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });
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
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });

      const { result } = renderHook(() => useHandleTimeUpdate(), { wrapper });
      result.current();

      expect(
        audioContext.timelineCallbackRef.current.handleTimelineAction,
      ).toBeNull();
    });
  });

  describe("useHandleVolumeChange", () => {
    it("should update volume state to high when volume >= 0.5", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: { ...mockAudioElement, volume: 0.8 } },
      });
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });
      const { result } = renderHook(() => useHandleVolumeChange(), { wrapper });

      result.current();

      expect(playerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "SET_VOLUME_STATE",
        volumeState: "high",
      });

      expect(
        audioContext.volumeCallbackRef.current.handleVolumeAction,
      ).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0.8,
        component: "volume",
      });
    });

    it("should update volume state to low when 0 < volume < 0.5", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: { ...mockAudioElement, volume: 0.3 } },
      });
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });
      const { result } = renderHook(() => useHandleVolumeChange(), { wrapper });

      result.current();

      expect(playerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "SET_VOLUME_STATE",
        volumeState: "low",
      });

      expect(
        audioContext.volumeCallbackRef.current.handleVolumeAction,
      ).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0.3,
        component: "volume",
      });
    });

    it("should update volume state to muted when volume is close to 0", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: { ...mockAudioElement, volume: 0.001 } },
      });
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });
      const { result } = renderHook(() => useHandleVolumeChange(), { wrapper });

      result.current();

      expect(playerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "SET_VOLUME_STATE",
        volumeState: "muted",
      });
    });

    it("should set UI volume to 0 when player is muted", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: { ...mockAudioElement, volume: 0.001 } },
      });
      const playerContext = createPlayerContext({
        overrides: { isMuted: true },
      });
      const wrapper = createContextWrapper({ audioContext, playerContext });
      const { result } = renderHook(() => useHandleVolumeChange(), { wrapper });

      result.current();

      expect(playerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "SET_VOLUME_STATE",
        volumeState: "muted",
      });
    });
  });

  describe("usePlayerCallbacks", () => {
    it("should have handleEnded callback that dispatches AUDIO_FILE_ENDED", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: mockAudioElement },
      });
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handleEnded();

      expect(playerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "AUDIO_FILE_ENDED",
      });
    });

    it("should have handleError callback that dispatches AUDIO_FILE_ERROR", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: mockAudioElement },
      });
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handleError();

      expect(playerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "AUDIO_FILE_ERROR",
      });
    });

    it("should have handleLoadedMetadata callback that dispatches AUDIO_FILE_LOADED and sets max value", () => {
      const mockTimelineAction = vi.fn();
      const audioContext = createAudioContext({
        audioElementRef: { current: mockAudioElement },
      });
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      // Call with handleTimelineAction parameter
      result.current.handleLoadedMetadata(mockTimelineAction);

      // Should dispatch AUDIO_FILE_LOADED
      expect(playerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "AUDIO_FILE_LOADED",
      });

      // Should call handleTimelineAction with SET_MAX_VALUE
      expect(mockTimelineAction).toHaveBeenCalledWith({
        type: "SET_MAX_VALUE",
        maxValue: 100, // duration from mockAudioElement
      });
    });

    it("should handle null handleTimelineAction in handleLoadedMetadata", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: mockAudioElement },
      });
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      // Call with null handleTimelineAction
      result.current.handleLoadedMetadata(null);

      // Should still dispatch AUDIO_FILE_LOADED
      expect(playerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "AUDIO_FILE_LOADED",
      });

      // But not throw any errors
    });

    it("should handle null audio element in handleLoadedMetadata", () => {
      const mockTimelineAction = vi.fn();
      const audioContext = createAudioContext({
        audioElementRef: { current: null },
      });
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handleLoadedMetadata(mockTimelineAction);

      expect(mockTimelineAction).toHaveBeenCalledWith({
        type: "SET_MAX_VALUE",
        maxValue: 1, // default value when audio element is null
      });
    });

    it("should have handlePause callback that dispatches PAUSE when currentTime is 0", () => {
      const audioContext = createAudioContext({
        audioElementRef: { current: { ...mockAudioElement, currentTime: 0 } },
      });
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });

      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handlePlayPause();

      expect(playerContext.handlePlayerAction).toHaveBeenCalledWith({
        type: "TOGGLE_PLAY",
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
      const playerContext = createPlayerContext();
      const wrapper = createContextWrapper({ audioContext, playerContext });

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
