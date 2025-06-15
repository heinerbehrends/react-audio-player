import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleMediaKeys,
  useHandleMediaKeys,
} from "../../src/KeyboardControls/handleMediaKeys";
import { renderHook } from "@testing-library/react";
import type {
  PlayerContextType,
  PlayerContextAction,
} from "../../src/Player/PlayerContext";
import React from "react";
import { createPlayerContext } from "../testUtils";
import {
  SliderComponent,
  SliderContextAction,
} from "../../src/Slider/SliderContext";
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
  const mockHandleVolumeAction = vi.fn();
  let defaultArgs: {
    event: React.KeyboardEvent<HTMLButtonElement>;
    unmuteVolume: number;
    component: SliderComponent;
    isMuted: boolean;
    handlePlayerAction: (action: PlayerContextAction) => void;
    handleSideEffect: (action: SideEffectAction) => void;
    volumeCallbackRef: {
      current: { handleVolumeAction: (action: SliderContextAction) => void };
    };
  } & ReturnType<PlayerContextType["getPlayerState"]>;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultArgs = {
      event: {
        key: "",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLButtonElement>,
      ...createPlayerContext().getPlayerState(),
      unmuteVolume: 0.7,
      component: "timeline",
      isMuted: false,
      handlePlayerAction: mockHandlePlayerAction,
      handleSideEffect: mockHandleSideEffect,
      volumeCallbackRef: {
        current: { handleVolumeAction: mockHandleVolumeAction },
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

    it("should not handle space and on sliders", () => {
      const key = " ";
      mockHandleSideEffect.mockClear();

      const result1 = handleMediaKeys(defaultArgs);

      expect(result1).toBe(false);
      expect(mockHandleSideEffect).not.toHaveBeenCalled();

      // Component defined
      mockHandleSideEffect.mockClear();
      defaultArgs.event.key = key;
      defaultArgs.component = "timeline";

      const result2 = handleMediaKeys(defaultArgs);

      expect(result2).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "TOGGLE_PLAY",
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
          unmuteVolume: 0.5, // current volume
        });
      });
    });

    it("should use unmuteVolume when current volume is close to zero", () => {
      defaultArgs.event.key = "m";
      defaultArgs.volume = 0.001; // Nearly zero

      const result = handleMediaKeys(defaultArgs);
      expect(result).toBe(true);
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "TOGGLE_MUTE",
        unmuteVolume: 0.7, // unmuteVolume
      });
    });

    it("should handle volume up key (ArrowUp)", () => {
      defaultArgs.event.key = "ArrowUp";

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        value: 0.525, // 0.5 + 0.025
        component: "volume",
      });
    });

    it("should handle volume down key (ArrowDown)", () => {
      defaultArgs.event.key = "ArrowDown";

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "UNMUTE",
      });
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        value: 0.475, // 0.5 - 0.025
        component: "volume",
      });
    });

    it("should handle volume down to near zero case", () => {
      defaultArgs.event.key = "ArrowDown";
      defaultArgs.volume = 0.02; // Just above zero

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "SET_UNMUTE_VOLUME",
        unmuteVolume: 0.025,
      });
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        value: 0, // clamped at 0
        component: "volume",
      });
    });

    describe("Mute toggle behavior", () => {
      it("should handle mute toggle with unmuteVolumeRef when volume is near zero", () => {
        defaultArgs.event.key = "m";
        defaultArgs.volume = 0.001;
        defaultArgs.unmuteVolumeRef = { current: 0.7 };
        defaultArgs.isMuted = false;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "TOGGLE_MUTE",
          unmuteVolume: 0.7,
        });
      });

      it("should handle mute toggle with current volume when volume is not near zero", () => {
        defaultArgs.event.key = "m";
        defaultArgs.volume = 0.5;
        defaultArgs.unmuteVolumeRef = { current: 0.7 };
        defaultArgs.isMuted = false;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "TOGGLE_MUTE",
          unmuteVolume: 0.5,
        });
      });

      it("should update UI value when muting", () => {
        const mockHandleVolumeAction = vi.fn();
        defaultArgs.event.key = "m";
        defaultArgs.volume = 0.5;
        defaultArgs.isMuted = false;
        defaultArgs.volumeCallbackRef = {
          current: { handleVolumeAction: mockHandleVolumeAction },
        };

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(mockHandleVolumeAction).toHaveBeenCalledWith({
          type: "UPDATE_UI_VALUE",
          value: 0,
          component: "volume",
        });
      });

      it("should update UI value when unmuting", () => {
        const mockHandleVolumeAction = vi.fn();
        defaultArgs.event.key = "m";
        defaultArgs.volume = 0.5;
        defaultArgs.isMuted = true;
        defaultArgs.volumeCallbackRef = {
          current: { handleVolumeAction: mockHandleVolumeAction },
        };

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(mockHandleVolumeAction).toHaveBeenCalledWith({
          type: "UPDATE_UI_VALUE",
          value: 0.5,
          component: "volume",
        });
      });
    });
  });

  describe("Seeking keys", () => {
    it("should handle seek forward (ArrowRight)", () => {
      mockHandleSideEffect.mockClear();
      defaultArgs.event.key = "ArrowRight";

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        value: 5, // Relative forward seek of 5 seconds
        component: "timeline",
      });
    });

    it("should handle seek backward (ArrowLeft)", () => {
      defaultArgs.event.key = "ArrowLeft";

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        value: -5, // Relative backward seek of 5 seconds
        component: "timeline",
      });
    });

    it("should handle larger seek forward (l)", () => {
      defaultArgs.event.key = "l";

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        value: 10, // Relative forward seek of 10 seconds
        component: "timeline",
      });
    });

    it("should handle larger seek backward (j)", () => {
      defaultArgs.event.key = "j";

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        value: -10, // Relative backward seek of 10 seconds
        component: "timeline",
      });
    });
  });

  describe("Numeric seek keys", () => {
    it("should handle numeric keys to seek to percentage of duration", () => {
      // Set up test data with a specific duration
      mockHandleSideEffect.mockClear();
      defaultArgs = {
        ...defaultArgs,
        duration: 100,
        currentTime: 30,
      };

      const numericTests = [
        { key: "0", expected: 0 },
        { key: "1", expected: 10 }, // 10% of 100
        { key: "5", expected: 50 }, // 50% of 100
        { key: "9", expected: 90 }, // 90% of 100
      ];

      numericTests.forEach((test) => {
        defaultArgs.event.key = test.key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandleSideEffect).toHaveBeenCalledWith({
          type: "CHANGE_VALUE",
          value: test.expected,
          component: "timeline",
        });
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
          type: "SET_PLAYBACK_RATE",
          playbackRate: 1.25, // 1 + 0.25
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
          type: "SET_PLAYBACK_RATE",
          playbackRate: 0.75, // 1 - 0.25
        });
      });
    });

    it("should handle reset playback rate key (Backspace)", () => {
      defaultArgs.event.key = "Backspace";
      defaultArgs.playbackRate = 2;

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandleSideEffect).toHaveBeenCalledWith({
        type: "SET_PLAYBACK_RATE",
        playbackRate: 1, // reset to 1
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

  it("should handle play/pause key correctly", () => {
    // Clear any previous mock calls
    mockHandleSideEffect.mockClear();

    const audioContext = createAudioContext({
      audioElementRef: {
        current: createMockAudioElement() as HTMLAudioElement,
      },
    });

    // Mock the handleSideEffect to return true
    mockHandleSideEffect.mockImplementation(() => true);

    const playerContext = createPlayerContext({
      overrides: {
        getPlayerState: () => ({
          duration: 100,
          currentTime: 30,
          volume: 0.5,
          playbackRate: 1,
          volumeState: "high",
          unmuteVolumeRef: { current: 0.7 },
          handlePlayerAction: vi.fn(),
          playerState: "paused",
          showCaptions: false,
          isMuted: false,
        }),
        playbackRate: 1,
        volumeState: "high",
        isMuted: false,
      },
    });
    const wrapper = createContextWrapper({ audioContext, playerContext });

    const { result } = renderHook(
      () => useHandleMediaKeys("timeline" as SliderComponent),
      {
        wrapper,
      },
    );

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
    } satisfies SideEffectAction);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it("should handle volume up key correctly", () => {
    const audioContext = createAudioContext({
      audioElementRef: {
        current: createMockAudioElement() as HTMLAudioElement,
      },
    });
    const playerContext = createPlayerContext({
      overrides: {
        getPlayerState: () => ({
          duration: 100,
          currentTime: 30,
          volume: 0.5,
          playbackRate: 1,
          volumeState: "high",
          unmuteVolumeRef: { current: 0.7 },
          handlePlayerAction: vi.fn(),
          playerState: "paused",
          showCaptions: false,
          isMuted: false,
        }),
        volumeState: "high",
        isMuted: false,
      },
    });
    const wrapper = createContextWrapper({ audioContext, playerContext });

    const { result } = renderHook(
      () => useHandleMediaKeys("volume" as SliderComponent),
      {
        wrapper,
      },
    );

    const mockEvent = {
      key: "ArrowUp",
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLButtonElement>;

    result.current(mockEvent);

    expect(mockHandleSideEffect).toHaveBeenCalledWith({
      type: "CHANGE_VALUE",
      value: 0.525,
      component: "volume",
    } satisfies SideEffectAction);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it("should handle volume down key correctly", () => {
    const audioContext = createAudioContext({
      audioElementRef: {
        current: createMockAudioElement() as HTMLAudioElement,
      },
    });
    const playerContext = createPlayerContext({
      overrides: {
        getPlayerState: () => ({
          duration: 100,
          currentTime: 30,
          volume: 0.5,
          playbackRate: 1,
          volumeState: "high",
          unmuteVolumeRef: { current: 0.7 },
          handlePlayerAction: vi.fn(),
          playerState: "paused",
          showCaptions: false,
          isMuted: false,
        }),
        volumeState: "high",
        isMuted: false,
      },
    });
    const wrapper = createContextWrapper({ audioContext, playerContext });

    const { result } = renderHook(
      () => useHandleMediaKeys("volume" as SliderComponent),
      {
        wrapper,
      },
    );

    const mockEvent = {
      key: "ArrowDown",
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLButtonElement>;

    result.current(mockEvent);

    expect(mockHandleSideEffect).toHaveBeenCalledWith({
      type: "CHANGE_VALUE",
      value: 0.475,
      component: "volume",
    } satisfies SideEffectAction);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });
});
