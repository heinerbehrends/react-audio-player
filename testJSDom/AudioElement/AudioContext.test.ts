import { describe, it, expect } from "vitest";
import { AudioContext } from "../../src/AudioElement/AudioContext";
import { handleSideEffect } from "../../src/AudioElement/handleSideEffect";

describe("AudioContext", () => {
  it("should export AudioContext with default values", () => {
    expect(AudioContext).toBeDefined();
    expect(AudioContext.displayName).toBe("AudioContext");
  });

  it("should have correct default context value shape", () => {
    const defaultValue = AudioContext["_currentValue"];

    expect(defaultValue).toEqual({
      audioElementRef: { current: null },
      handleSideEffect,
      timelineCallbackRef: { current: { handleTimelineAction: null } },
      volumeCallbackRef: { current: { handleVolumeAction: null } },
      playbackRateCallbackRef: { current: { handlePlaybackRateAction: null } },
    });
  });
});
