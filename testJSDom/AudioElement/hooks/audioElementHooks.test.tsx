import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useHandleTimeUpdate,
  useHandleVolumeChange,
  usePlayerCallbacks,
  useHandlePlaybackRateChange,
} from "../../../src/AudioElement/hooks/audioElementHooks";
import { PlayerContext } from "../../../src/Player/PlayerContext";
import { AudioContext } from "../../../src/AudioElement/AudioContext";
import React from "react";

describe("audioElementHooks", () => {
  const mockHandlePlayerAction = vi.fn();
  const mockHandleTimelineAction = vi.fn();
  const mockHandleVolumeAction = vi.fn();
  const mockHandlePlaybackRateAction = vi.fn();
  let mockAudioElement;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAudioElement = {
      currentTime: 10,
      volume: 0.5,
      playbackRate: 1,
      duration: 100,
    };
  });

  const defaultPlayerContext = {
    handlePlayerAction: mockHandlePlayerAction,
    playerState: "paused" as const,
    showCaptions: false,
    isMuted: false,
    volumeState: "high" as const,
    playbackRate: 1,
    unmuteVolumeRef: { current: 0.7 },
    getPlayerState: vi.fn(),
    timeDisplay: "elapsed" as const,
    audioFiles: [],
    cues: [],
  };

  // Helper to create wrapper with necessary contexts
  const createWrapper = ({
    audioElementValue = mockAudioElement,
    isMuted = false,
  } = {}) => {
    const audioContext = {
      audioElementRef: { current: audioElementValue },
      timelineCallbackRef: {
        current: { handleTimelineAction: mockHandleTimelineAction },
      },
      volumeCallbackRef: {
        current: { handleVolumeAction: mockHandleVolumeAction },
      },
      playbackRateCallbackRef: {
        current: { handlePlaybackRateAction: mockHandlePlaybackRateAction },
      },
      handleSideEffect: vi.fn(),
    };

    return ({ children }) => (
      <PlayerContext.Provider
        value={{
          ...defaultPlayerContext,
          handlePlayerAction: mockHandlePlayerAction,
          isMuted,
        }}
      >
        <AudioContext.Provider value={audioContext}>
          {children}
        </AudioContext.Provider>
      </PlayerContext.Provider>
    );
  };

  describe("useHandleTimeUpdate", () => {
    it("should call timelineCallbackRef handler with current time", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useHandleTimeUpdate(), { wrapper });

      // Call the resulting callback
      result.current();

      expect(mockHandleTimelineAction).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 10, // current time from mockAudioElement
        component: "timeline",
      });
    });

    it("should handle null audioElement", () => {
      const wrapper = createWrapper({ audioElementValue: null });
      const { result } = renderHook(() => useHandleTimeUpdate(), { wrapper });

      // Call the resulting callback
      result.current();

      expect(mockHandleTimelineAction).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0, // default when audio element is null
        component: "timeline",
      });
    });

    it("should not call timelineCallbackRef handler when it's null", () => {
      const audioContext = {
        audioElementRef: { current: mockAudioElement },
        timelineCallbackRef: { current: { handleTimelineAction: null } },
        volumeCallbackRef: {
          current: { handleVolumeAction: mockHandleVolumeAction },
        },
        playbackRateCallbackRef: {
          current: { handlePlaybackRateAction: mockHandlePlaybackRateAction },
        },
        handleSideEffect: vi.fn(),
      };

      const wrapper = ({ children }) => (
        <PlayerContext.Provider
          value={{
            ...defaultPlayerContext,
            handlePlayerAction: mockHandlePlayerAction,
          }}
        >
          <AudioContext.Provider value={audioContext}>
            {children}
          </AudioContext.Provider>
        </PlayerContext.Provider>
      );

      const { result } = renderHook(() => useHandleTimeUpdate(), { wrapper });

      result.current();

      expect(mockHandleTimelineAction).not.toHaveBeenCalled();
    });
  });

  describe("useHandleVolumeChange", () => {
    it("should update volume state to high when volume >= 0.5", () => {
      const wrapper = createWrapper({
        audioElementValue: { ...mockAudioElement, volume: 0.8 },
      });
      const { result } = renderHook(() => useHandleVolumeChange(), { wrapper });

      result.current();

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "SET_VOLUME_STATE",
        volumeState: "high",
      });

      expect(mockHandleVolumeAction).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0.8,
        component: "volume",
      });
    });

    it("should update volume state to low when 0 < volume < 0.5", () => {
      const wrapper = createWrapper({
        audioElementValue: { ...mockAudioElement, volume: 0.3 },
      });
      const { result } = renderHook(() => useHandleVolumeChange(), { wrapper });

      result.current();

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "SET_VOLUME_STATE",
        volumeState: "low",
      });

      expect(mockHandleVolumeAction).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 0.3,
        component: "volume",
      });
    });

    it("should update volume state to muted when volume is close to 0", () => {
      const wrapper = createWrapper({
        audioElementValue: { ...mockAudioElement, volume: 0.001 },
      });
      const { result } = renderHook(() => useHandleVolumeChange(), { wrapper });

      result.current();

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "SET_VOLUME_STATE",
        volumeState: "muted",
      });
    });

    it("should not update volume when player is muted", () => {
      const wrapper = createWrapper({ isMuted: true });
      const { result } = renderHook(() => useHandleVolumeChange(), { wrapper });

      result.current();

      expect(mockHandlePlayerAction).not.toHaveBeenCalled();
      expect(mockHandleVolumeAction).not.toHaveBeenCalled();
    });
  });

  describe("usePlayerCallbacks", () => {
    it("should have handleEnded callback that dispatches AUDIO_FILE_ENDED", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handleEnded();

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "AUDIO_FILE_ENDED",
      });
    });

    it("should have handleError callback that dispatches AUDIO_FILE_ERROR", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handleError();

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "AUDIO_FILE_ERROR",
      });
    });

    it("should have handleLoadedMetadata callback that dispatches AUDIO_FILE_LOADED and sets max value", () => {
      const mockTimelineAction = vi.fn();
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      // Call with handleTimelineAction parameter
      result.current.handleLoadedMetadata(mockTimelineAction);

      // Should dispatch AUDIO_FILE_LOADED
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "AUDIO_FILE_LOADED",
      });

      // Should call handleTimelineAction with SET_MAX_VALUE
      expect(mockTimelineAction).toHaveBeenCalledWith({
        type: "SET_MAX_VALUE",
        maxValue: 100, // duration from mockAudioElement
      });
    });

    it("should handle null handleTimelineAction in handleLoadedMetadata", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      // Call with null handleTimelineAction
      result.current.handleLoadedMetadata(null);

      // Should still dispatch AUDIO_FILE_LOADED
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "AUDIO_FILE_LOADED",
      });

      // But not throw any errors
    });

    it("should handle null audio element in handleLoadedMetadata", () => {
      const mockTimelineAction = vi.fn();
      const wrapper = createWrapper({ audioElementValue: null });
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handleLoadedMetadata(mockTimelineAction);

      expect(mockTimelineAction).toHaveBeenCalledWith({
        type: "SET_MAX_VALUE",
        maxValue: 1, // default value when audio element is null
      });
    });

    it("should have handlePause callback that dispatches PAUSE when currentTime is 0", () => {
      const wrapper = createWrapper({
        audioElementValue: { ...mockAudioElement, currentTime: 0 },
      });

      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handlePause();

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "PAUSE",
      });
    });

    it("should not dispatch PAUSE when currentTime is not 0", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => usePlayerCallbacks(), { wrapper });

      result.current.handlePause();

      expect(mockHandlePlayerAction).not.toHaveBeenCalled();
    });
  });

  describe("useHandlePlaybackRateChange", () => {
    it("should update UI and dispatch playback rate change", () => {
      const wrapper = createWrapper({
        audioElementValue: { ...mockAudioElement, playbackRate: 1.5 },
      });

      const { result } = renderHook(() => useHandlePlaybackRateChange(), {
        wrapper,
      });

      result.current();

      expect(mockHandlePlaybackRateAction).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 1.5,
        component: "playbackRate",
      });

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "SET_PLAYBACK_RATE",
        playbackRate: 1.5,
      });
    });

    it("should use default playback rate of 1 if audio element is null", () => {
      const wrapper = createWrapper({ audioElementValue: null });
      const { result } = renderHook(() => useHandlePlaybackRateChange(), {
        wrapper,
      });

      result.current();

      expect(mockHandlePlaybackRateAction).toHaveBeenCalledWith({
        type: "UPDATE_UI_VALUE",
        value: 1,
        component: "playbackRate",
      });

      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "SET_PLAYBACK_RATE",
        playbackRate: 1,
      });
    });

    it("should not call playbackRateCallbackRef handler when it's null", () => {
      const audioContext = {
        audioElementRef: { current: mockAudioElement },
        timelineCallbackRef: {
          current: { handleTimelineAction: mockHandleTimelineAction },
        },
        volumeCallbackRef: {
          current: { handleVolumeAction: mockHandleVolumeAction },
        },
        playbackRateCallbackRef: {
          current: { handlePlaybackRateAction: null },
        },
        handleSideEffect: vi.fn(),
      };

      const wrapper = ({ children }) => (
        <PlayerContext.Provider
          value={{
            ...defaultPlayerContext,
            // Override only what's needed
            handlePlayerAction: mockHandlePlayerAction,
          }}
        >
          <AudioContext.Provider value={audioContext}>
            {children}
          </AudioContext.Provider>
        </PlayerContext.Provider>
      );

      const { result } = renderHook(() => useHandlePlaybackRateChange(), {
        wrapper,
      });

      result.current();

      // Should still call player action but not UI update
      expect(mockHandlePlaybackRateAction).not.toHaveBeenCalled();
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "SET_PLAYBACK_RATE",
        playbackRate: mockAudioElement.playbackRate,
      });
    });
  });
});
