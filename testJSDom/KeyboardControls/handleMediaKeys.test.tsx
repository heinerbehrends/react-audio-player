import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleMediaKeys,
  useHandleMediaKeys,
} from "../../src/KeyboardControls/handleMediaKeys";
import { renderHook } from "@testing-library/react";
import {
  PlayerContext,
  PlayerContextType,
  PlayerProviderAction,
} from "../../src/Player/PlayerContext";
import React from "react";
import { createPlayerContext } from "../testUtils";
import {
  SliderComponent,
  SliderContextAction,
} from "../../src/Slider/SliderContext";

describe("handleMediaKeys", () => {
  const mockHandlePlayerAction = vi.fn();
  const mockHandleVolumeAction = vi.fn();
  let defaultArgs: {
    event: React.KeyboardEvent<HTMLButtonElement>;
    unmuteVolume: number;
    component: SliderComponent;
    isMuted: boolean;
    handlePlayerAction: (action: PlayerProviderAction) => void;
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
      volumeCallbackRef: {
        current: { handleVolumeAction: mockHandleVolumeAction },
      },
    };
  });

  describe("Playback control keys", () => {
    it("should handle play/pause keys (p, k, MediaPlayPause)", () => {
      const playPauseKeys = ["p", "P", "k", "K", "MediaPlayPause"];

      playPauseKeys.forEach((key) => {
        mockHandlePlayerAction.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);
        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandlePlayerAction).toHaveBeenCalledWith({
          type: "TOGGLE_PLAY",
        });
      });
    });

    it("should handle stop key (s, MediaStop)", () => {
      const stopKeys = ["s", "S", "MediaStop"];

      stopKeys.forEach((key) => {
        mockHandlePlayerAction.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandlePlayerAction).toHaveBeenCalledWith({
          type: "STOP_AUDIO",
        });
      });
    });

    it("should not handle space and on sliders", () => {
      const key = " ";

      // Component not defined
      mockHandlePlayerAction.mockClear();

      const result1 = handleMediaKeys(defaultArgs);

      expect(result1).toBe(false);
      expect(mockHandlePlayerAction).not.toHaveBeenCalled();

      // Component defined
      mockHandlePlayerAction.mockClear();
      defaultArgs.event.key = key;
      defaultArgs.component = "timeline";

      const result2 = handleMediaKeys(defaultArgs);

      expect(result2).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "TOGGLE_PLAY",
      });
    });
  });

  describe("Volume control keys", () => {
    it("should handle mute toggle key (m, MediaMute)", () => {
      const muteKeys = ["m", "M", "MediaMute"];

      muteKeys.forEach((key) => {
        mockHandlePlayerAction.mockClear();
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(mockHandlePlayerAction).toHaveBeenCalledWith({
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
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "TOGGLE_MUTE",
        unmuteVolume: 0.7, // unmuteVolume
      });
    });

    it("should handle volume up key (ArrowUp)", () => {
      defaultArgs.event.key = "ArrowUp";

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
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
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "UNMUTE",
      });
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
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
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
        type: "SET_UNMUTE_VOLUME",
        unmuteVolume: 0.025,
      });
      expect(mockHandlePlayerAction).toHaveBeenCalledWith({
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
        expect(mockHandlePlayerAction).toHaveBeenCalledWith({
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
        expect(mockHandlePlayerAction).toHaveBeenCalledWith({
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
      defaultArgs.event.key = "ArrowRight";

      const result = handleMediaKeys(defaultArgs);

      expect(result).toBe(true);
      expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
      expect(defaultArgs.handlePlayerAction).toHaveBeenCalledWith({
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
      expect(defaultArgs.handlePlayerAction).toHaveBeenCalledWith({
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
      expect(defaultArgs.handlePlayerAction).toHaveBeenCalledWith({
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
      expect(defaultArgs.handlePlayerAction).toHaveBeenCalledWith({
        type: "CHANGE_VALUE",
        value: -10, // Relative backward seek of 10 seconds
        component: "timeline",
      });
    });
  });

  describe("Numeric seek keys", () => {
    it("should handle numeric keys to seek to percentage of duration", () => {
      // Set up test data with a specific duration
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
        expect(defaultArgs.handlePlayerAction).toHaveBeenCalledWith({
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
        defaultArgs.event.key = key;

        const result = handleMediaKeys(defaultArgs);

        expect(result).toBe(true);
        expect(defaultArgs.event.preventDefault).toHaveBeenCalled();
        expect(defaultArgs.handlePlayerAction).toHaveBeenCalledWith({
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
        expect(defaultArgs.handlePlayerAction).toHaveBeenCalledWith({
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
      expect(defaultArgs.handlePlayerAction).toHaveBeenCalledWith({
        type: "SET_PLAYBACK_RATE",
        playbackRate: 1, // reset to 1
      });
    });
  });

  it("should return false for unhandled keys", () => {
    defaultArgs.event.key = "a"; // Unhandled key

    const result = handleMediaKeys(defaultArgs);

    expect(result).toBe(false);
    expect(defaultArgs.event.preventDefault).not.toHaveBeenCalled();
    expect(defaultArgs.handlePlayerAction).not.toHaveBeenCalled();
  });
});

describe("useHandleMediaKeys", () => {
  it("should handle keyboard events correctly", () => {
    // Create a mock for the player action
    const handlePlayerAction = vi.fn();

    // Create mock context with our spy
    const mockPlayerContext = {
      handlePlayerAction,
      unmuteVolumeRef: { current: 0.7 },
      getPlayerState: vi.fn().mockReturnValue({
        duration: 100,
        currentTime: 30,
        volume: 0.5,
        unmuteVolumeRef: { current: 0.7 },
      }),
      // Add other required props...
      playbackRate: 1,
      volumeState: "high" as const,
      playerState: "paused" as const,
      showCaptions: false,
      isMuted: false,
      timeDisplay: "elapsed" as const,
      audioFiles: [],
      cues: [],
    };

    // Create wrapper to provide context
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlayerContext.Provider value={mockPlayerContext}>
        {children}
      </PlayerContext.Provider>
    );

    // Render the hook
    const { result } = renderHook(() => useHandleMediaKeys("timeline"), {
      wrapper,
    });

    // Create a mock event
    const mockEvent = {
      key: "p",
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLButtonElement>;

    // Call the returned callback
    result.current(mockEvent);

    // Verify the player action was called with the expected action
    expect(handlePlayerAction).toHaveBeenCalledWith({
      type: "TOGGLE_PLAY",
    });
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });
});
