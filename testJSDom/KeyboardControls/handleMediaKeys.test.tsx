import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleMediaKeys,
  useHandleMediaKeys,
} from "../../src/KeyboardControls/handleMediaKeys";
import { renderHook } from "@testing-library/react";
import type { PlayerContextAction } from "../../src/Player/PlayerContext";
import React from "react";
import { createPlayerContext } from "../testUtils";
import type { SideEffectAction } from "../../src/AudioElement/sideEffectActions";
import { createAudioContext, createMockAudioElement } from "../testUtils";
import { createContextWrapper } from "../testComponents";

// Mock useHandleSideEffect hook
const mockHandleSideEffect = vi.fn();
vi.mock("../../src/AudioElement/useHandleSideEffect", () => ({
  useHandleSideEffect: () => mockHandleSideEffect,
}));

describe("handleMediaKeys", () => {
  const mockHandlePlayerAction = vi.fn();
  let defaultArgs: {
    event: React.KeyboardEvent<HTMLButtonElement>;
    handlePlayerAction: (action: PlayerContextAction) => void;
    handleSideEffect: (action: SideEffectAction) => void;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultArgs = {
      event: {
        key: "",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLButtonElement>,
      handlePlayerAction: mockHandlePlayerAction,
      handleSideEffect: mockHandleSideEffect,
    };
  });

  describe("Playback control keys", () => {
    it("should handle play/pause keys (p, k, MediaPlayPause)", () => {
      const playPauseKeys = ["p", "P", "k", "K", "MediaPlayPause", " "];

      playPauseKeys.forEach((key) => {
        mockHandleSideEffect.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);
        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "TOGGLE_PLAY",
        });
      });
    });

    it("should handle stop key (s, MediaStop)", () => {
      const stopKeys = ["s", "S", "MediaStop"];

      stopKeys.forEach((key) => {
        mockHandleSideEffect.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "STOP_AUDIO",
        });
      });
    });
  });

  describe("Volume control keys", () => {
    it("should handle mute toggle key (m, MediaMute)", () => {
      const muteKeys = ["m", "M", "MediaMute"];

      muteKeys.forEach((key) => {
        mockHandleSideEffect.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "TOGGLE_MUTE",
        });
      });
    });

    it("should handle volume up key (ArrowUp, MediaVolumeUp)", () => {
      const volumeUpKeys = ["ArrowUp", "MediaVolumeUp"];

      volumeUpKeys.forEach((key) => {
        mockHandleSideEffect.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "INCREASE_VOLUME",
          value: 0.025,
        });
      });
    });

    it("should handle volume down key (ArrowDown, MediaVolumeDown)", () => {
      const volumeDownKeys = ["ArrowDown", "MediaVolumeDown"];

      volumeDownKeys.forEach((key) => {
        mockHandleSideEffect.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "DECREASE_VOLUME",
          value: 0.025,
        });
      });
    });
  });

  describe("Seeking keys", () => {
    it("should handle seek forward (ArrowRight, l)", () => {
      const seekForwardTests = [
        { key: "ArrowRight", value: 5 },
        { key: "l", value: 10 },
        { key: "L", value: 10 },
      ];

      seekForwardTests.forEach(({ key, value }) => {
        mockHandleSideEffect.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "SET_TIME_FORWARD",
          value,
        });
      });
    });

    it("should handle seek backward (ArrowLeft, j)", () => {
      const seekBackwardTests = [
        { key: "ArrowLeft", value: 5 },
        { key: "j", value: 10 },
        { key: "J", value: 10 },
      ];

      seekBackwardTests.forEach(({ key, value }) => {
        mockHandleSideEffect.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "SET_TIME_BACKWARD",
          value,
        });
      });
    });
  });

  describe("Numeric seek keys", () => {
    it("should handle numeric keys to seek to percentage of duration", () => {
      const numericTests = [
        { key: "0", expected: { type: "SET_TIME_TO_START" } },
        { key: "1", expected: { type: "SET_TIME_TO_PERCENT", percent: 0.1 } },
        { key: "5", expected: { type: "SET_TIME_TO_PERCENT", percent: 0.5 } },
        { key: "9", expected: { type: "SET_TIME_TO_PERCENT", percent: 0.9 } },
      ];

      numericTests.forEach((test) => {
        mockHandleSideEffect.mockClear();
        defaultArgs.event.key = test.key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith(test.expected);
      });
    });
  });

  describe("Playback rate keys", () => {
    it("should handle increase playback rate keys (>, ])", () => {
      const increaseKeys = [">", "]"];
      increaseKeys.forEach((key) => {
        mockHandleSideEffect.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "INCREASE_PLAYBACK_RATE",
          value: 0.05,
        });
      });
    });

    it("should handle decrease playback rate keys (<, [)", () => {
      const decreaseKeys = ["<", "["];

      decreaseKeys.forEach((key) => {
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "DECREASE_PLAYBACK_RATE",
          value: 0.05,
        });
      });
    });

    it("should handle reset playback rate key (Backspace)", () => {
      defaultArgs.event.key = "Backspace";

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "RESET_PLAYBACK_RATE",
      });
    });
  });

  describe("Caption control keys", () => {
    it("should handle caption toggle keys (c, C)", () => {
      const captionKeys = ["c", "C"];

      captionKeys.forEach((key) => {
        mockHandlePlayerAction.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandlePlayerAction).toHaveBeenCalledWith({
          type: "TOGGLE_CAPTIONS",
        });
      });
    });
  });

  it("should return false for unhandled keys", () => {
    mockHandleSideEffect.mockClear();
    defaultArgs.event.key = "a"; // Unhandled key

    const result = handleMediaKeys(defaultArgs);

    expect(result).toBe(false);
    expect(defaultArgs.event.preventDefault).not.toHaveBeenCalled();
    expect(mockHandleSideEffect).not.toHaveBeenCalled();
  });
});

describe("useHandleMediaKeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle key events correctly", () => {
    const audioContext = createAudioContext({
      audioElementRef: {
        current: createMockAudioElement() as HTMLAudioElement,
      },
    });

    const playerContext = createPlayerContext();
    const wrapper = createContextWrapper({ audioContext, playerContext });

    const { result } = renderHook(() => useHandleMediaKeys(), {
      wrapper,
    });

    const mockEvent = {
      key: "p",
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLButtonElement>;

    // Call the hook result with the mock event
    const handled = result.current(mockEvent);

    // Verify the mock was called with the correct arguments
    expect(handled).toBe(true);
    expect(mockHandleSideEffect).toHaveBeenCalledWith({
      type: "TOGGLE_PLAY",
    });
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it("should not stop propagation for unhandled keys", () => {
    const audioContext = createAudioContext({
      audioElementRef: {
        current: createMockAudioElement() as HTMLAudioElement,
      },
    });
    const playerContext = createPlayerContext();
    const wrapper = createContextWrapper({ audioContext, playerContext });

    const { result } = renderHook(() => useHandleMediaKeys(), {
      wrapper,
    });

    const mockEvent = {
      key: "x", // Unhandled key
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLButtonElement>;

    const handled = result.current(mockEvent);

    expect(handled).toBe(false);
    expect(mockHandleSideEffect).not.toHaveBeenCalled();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
  });
});
