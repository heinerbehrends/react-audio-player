import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleMediaKeys,
  KeyToActionMap,
  useHandleMediaKeys,
} from "../../src/KeyboardControls/handleMediaKeys";
import { renderHook } from "@testing-library/react";
import React from "react";
import type { SideEffectAction } from "../../src/AudioElement/sideEffectActions";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import { PlayerConfigProvider } from "../../src/Player/PlayerConfigContext";
import { createTestStore } from "../store/createTestStore";
import type { MediaFields } from "../store/mediaElementFake";

const mockHandleSideEffect = vi.fn();

/**
 * `useHandleMediaKeys` dispatches through `store.send`, so the hook's own tests
 * assert on the attached element rather than on a mocked hook.
 */
function renderMediaKeys(element: Partial<MediaFields> = {}) {
  const harness = createTestStore({ readyState: 1, ...element });
  const { result } = renderHook(() => useHandleMediaKeys(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <PlayerStoreProvider store={harness.store}>
        <PlayerConfigProvider
          audioFile={{ src: "test-audio.mp3" }}
          customKeyboardShortcuts={undefined}
        >
          {children}
        </PlayerConfigProvider>
      </PlayerStoreProvider>
    ),
  });
  return { handle: result.current, ...harness };
}

function keyEvent(key: string) {
  return {
    key,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLButtonElement>;
}

describe("handleMediaKeys", () => {
  let defaultArgs: {
    event: React.KeyboardEvent<HTMLButtonElement>;
    handleSideEffect: (action: SideEffectAction) => void;
    customKeyboardShortcuts: KeyToActionMap;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultArgs = {
      event: {
        key: "",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLButtonElement>,
      handleSideEffect: mockHandleSideEffect,
      customKeyboardShortcuts: {
        "`": { type: "TOGGLE_PLAY" },
      },
    };
  });

  describe("Playback control keys", () => {
    it("should handle play/pause keys (p, k, MediaPlayPause)", () => {
      const playPauseKeys = ["p", "P", "k", "K", "MediaPlayPause"];

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

  describe("Custom keyboard shortcuts", () => {
    it("should handle custom shortcuts that override default ones while preserving other defaults", () => {
      defaultArgs.customKeyboardShortcuts = {
        x: { type: "TOGGLE_PLAY" },
      };

      defaultArgs.event.key = "x";
      let result = handleMediaKeys(defaultArgs);
      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "TOGGLE_PLAY",
      });

      vi.clearAllMocks();
      defaultArgs.event.key = "p";
      result = handleMediaKeys(defaultArgs);
      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "TOGGLE_PLAY",
      });

      vi.clearAllMocks();
      defaultArgs.event.key = "s";
      result = handleMediaKeys(defaultArgs);
      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({ type: "STOP_AUDIO" });
    });

    it("should handle custom shortcuts with different actions", () => {
      defaultArgs.customKeyboardShortcuts = {
        z: { type: "SET_TIME_FORWARD", value: 30 },
      };

      defaultArgs.event.key = "z";
      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "SET_TIME_FORWARD",
        value: 30,
      });
    });

    it("should handle a custom shortcut", () => {
      defaultArgs.event.key = "`";
      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "TOGGLE_PLAY",
      });
    });

    it("should handle multiple custom shortcuts", () => {
      defaultArgs.customKeyboardShortcuts = {
        x: { type: "TOGGLE_PLAY" },
        y: { type: "STOP_AUDIO" },
        z: { type: "SET_TIME_FORWARD", value: 30 },
      };

      const shortcuts = [
        { key: "x", action: { type: "TOGGLE_PLAY" } },
        { key: "y", action: { type: "STOP_AUDIO" } },
        { key: "z", action: { type: "SET_TIME_FORWARD", value: 30 } },
      ];

      shortcuts.forEach(({ key, action }) => {
        vi.clearAllMocks();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);
        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith(action);
      });
    });
  });

  it("should return false for unhandled keys", () => {
    mockHandleSideEffect.mockClear();
    defaultArgs.event.key = "a";

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
    const { handle, element } = renderMediaKeys({ paused: true });
    const event = keyEvent("p");

    const handled = handle(event);

    expect(handled).toBe(true);
    expect(element.play).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it("should not stop propagation for unhandled keys", () => {
    const { handle, element } = renderMediaKeys({ paused: true });
    const event = keyEvent("x");

    const handled = handle(event);

    expect(handled).toBe(false);
    expect(element.play).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });
});

/**
 * S15. A type, so the assertions are compile-time: `@ts-expect-error` fails the
 * build if the error stops happening — which is what a widened `KeyToActionMap`
 * would do.
 */
describe("what a key can be bound to", () => {
  it("accepts the actions a key should reach", () => {
    const map: KeyToActionMap = {
      a: { type: "TOGGLE_PLAY" },
      b: { type: "SET_TIME_TO_PERCENT", percent: 0.5 },
      c: { type: "INCREASE_PLAYBACK_RATE", value: 0.1, maxValue: 2 },
      d: { type: "STOP_AUDIO" },
    };

    expect(Object.keys(map)).toHaveLength(4);
  });

  it("rejects the slider commit and the end-of-track signal", () => {
    const map: KeyToActionMap = {
      // @ts-expect-error the slider commit path — see `KeyboardAction`
      a: { type: "CHANGE_VALUE", component: "volume", value: 0.5 },
      // @ts-expect-error the end-of-track signal — see `KeyboardAction`
      b: { type: "AUDIO_FILE_ENDED" },
    };

    expect(Object.keys(map)).toHaveLength(2);
  });
});
