import { describe, it, expect, beforeEach } from "vitest";
import {
  handleSideEffect as handleSideEffectWithContext,
  type SideEffectContext,
} from "../../src/AudioElement/handleSideEffect";
import type { SideEffectAction } from "../../src/AudioElement/sideEffectActions";
import { createMediaElementFake } from "../store/mediaElementFake";

/**
 * The write path takes a store snapshot now — a value, not an accessor, so this
 * suite gains an argument instead of a mock. Only `TOGGLE_MUTE` and `UNMUTE`
 * read it, so every other case leaves it at the default.
 */
const defaultContext: SideEffectContext = { lastAudibleVolume: 1 };

const handleSideEffect = (
  action: SideEffectAction,
  audioElement: HTMLAudioElement | null,
  context: SideEffectContext = defaultContext,
) => handleSideEffectWithContext(action, audioElement, context);

describe("handleSideEffect", () => {
  let audioElement: HTMLAudioElement;

  beforeEach(() => {
    audioElement = createMediaElementFake();
  });

  it("should do nothing if audio element is null", () => {
    const result = handleSideEffect({ type: "TOGGLE_PLAY" }, null);
    expect(result).toBeUndefined();
  });

  it("should handle PLAY and PAUSE action", () => {
    handleSideEffect({ type: "PLAY" }, audioElement);
    expect(audioElement.play).toHaveBeenCalled();

    audioElement = {
      ...audioElement,
      paused: false,
    } as HTMLAudioElement;
    handleSideEffect({ type: "PAUSE" }, audioElement);
    expect(audioElement.pause).toHaveBeenCalled();
  });

  it("should handle STOP_AUDIO action", () => {
    handleSideEffect({ type: "STOP_AUDIO" }, audioElement);
    expect(audioElement.currentTime).toBe(0);
    expect(audioElement.pause).toHaveBeenCalled();
  });

  it("should handle AUDIO_FILE_ENDED action", () => {
    audioElement.currentTime = 42;
    handleSideEffect({ type: "AUDIO_FILE_ENDED" }, audioElement);
    expect(audioElement.currentTime).toBe(0);
    expect(audioElement.pause).toHaveBeenCalled();
  });

  it("should handle TOGGLE_MUTE action", () => {
    handleSideEffect({ type: "TOGGLE_MUTE" }, audioElement);
    expect(audioElement.muted).toBe(true);

    handleSideEffect({ type: "TOGGLE_MUTE" }, audioElement);
    expect(audioElement.muted).toBe(false);
    expect(audioElement.volume).toBe(1);
  });

  it("leaves an audible volume alone when unmuting", () => {
    audioElement.muted = true;
    audioElement.volume = 0.3;

    handleSideEffect({ type: "TOGGLE_MUTE" }, audioElement, {
      lastAudibleVolume: 0.8,
    });

    expect(audioElement.muted).toBe(false);
    expect(audioElement.volume).toBe(0.3);
  });

  // The dead-end `lastAudibleVolume` exists to fix: getting to zero by any path
  // — drag, click, keyboard — used to leave a silent player with no way back,
  // because only the drag path stashed anything.
  it("restores the last audible volume when unmuting a silent player", () => {
    audioElement.muted = true;
    audioElement.volume = 0;

    handleSideEffect({ type: "TOGGLE_MUTE" }, audioElement, {
      lastAudibleVolume: 0.8,
    });

    expect(audioElement.muted).toBe(false);
    expect(audioElement.volume).toBe(0.8);
  });

  it("should handle UNMUTE action", () => {
    audioElement.muted = true;
    handleSideEffect({ type: "UNMUTE" }, audioElement);
    expect(audioElement.muted).toBe(false);
  });

  it("restores the last audible volume on UNMUTE too", () => {
    audioElement.muted = true;
    audioElement.volume = 0;

    handleSideEffect({ type: "UNMUTE" }, audioElement, {
      lastAudibleVolume: 0.6,
    });

    expect(audioElement.muted).toBe(false);
    expect(audioElement.volume).toBe(0.6);
  });

  it("should unmute if muted and volume is set above 0 on CHANGE_VALUE", () => {
    audioElement.muted = true;
    handleSideEffect(
      { type: "CHANGE_VALUE", component: "volume", value: 0.5 },
      audioElement,
    );
    expect(audioElement.muted).toBe(false);
    expect(audioElement.volume).toBe(0.5);
  });

  it("should handle CHANGE_VALUE action for volume", () => {
    handleSideEffect(
      {
        type: "CHANGE_VALUE",
        component: "volume",
        value: 0.7,
      },
      audioElement,
    );
    expect(audioElement.volume).toBe(0.7);
  });

  it("should change the current time on CHANGE_VALUE action for timeline", () => {
    handleSideEffect(
      { type: "CHANGE_VALUE", component: "timeline", value: 10 },
      audioElement,
    );
    expect(audioElement.currentTime).toBe(10);
  });

  it("should change the volume on CHANGE_VALUE action for volume", () => {
    handleSideEffect(
      { type: "CHANGE_VALUE", component: "volume", value: 0.5 },
      audioElement,
    );
    expect(audioElement.volume).toBe(0.5);
  });

  it("should change the playback rate on CHANGE_VALUE action for playback rate", () => {
    handleSideEffect(
      { type: "CHANGE_VALUE", component: "playbackRate", value: 1.5 },
      audioElement,
    );
    expect(audioElement.playbackRate).toBe(1.5);
  });

  it("should handle SET_PLAYBACK_RATE action", () => {
    handleSideEffect(
      { type: "SET_PLAYBACK_RATE", playbackRate: 1.5 },
      audioElement,
    );
    expect(audioElement.playbackRate).toBe(1.5);
  });

  /**
   * The ten keyboard actions. `handleMediaKeys.test` verifies key → action and
   * nothing verified action → element: two half-covered layers that never met.
   * Every clamp here is the only thing standing between a held-down arrow key and
   * an out-of-range media property.
   */
  describe("the keyboard actions", () => {
    it("clamps INCREASE_VOLUME at 1", () => {
      audioElement.volume = 0.99;
      handleSideEffect({ type: "INCREASE_VOLUME", value: 0.025 }, audioElement);
      expect(audioElement.volume).toBe(1);
    });

    // Deliberate: the case returns before assigning, so the volume is left where
    // it was and only `muted` changes. Unmuting then restores through
    // `lastAudibleVolume` rather than through this leftover value.
    it("mutes on DECREASE_VOLUME to near-zero and leaves volume untouched", () => {
      audioElement.volume = 0.02;
      handleSideEffect({ type: "DECREASE_VOLUME", value: 0.025 }, audioElement);
      expect(audioElement.muted).toBe(true);
      expect(audioElement.volume).toBe(0.02);
    });

    it("clamps INCREASE_PLAYBACK_RATE at 4", () => {
      audioElement.playbackRate = 3.99;
      handleSideEffect(
        { type: "INCREASE_PLAYBACK_RATE", value: 0.05 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(4);
    });

    it("clamps DECREASE_PLAYBACK_RATE at 0.5", () => {
      audioElement.playbackRate = 0.51;
      handleSideEffect(
        { type: "DECREASE_PLAYBACK_RATE", value: 0.05 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(0.5);
    });

    it("resets the rate to 1 on RESET_PLAYBACK_RATE", () => {
      audioElement.playbackRate = 2.5;
      handleSideEffect({ type: "RESET_PLAYBACK_RATE" }, audioElement);
      expect(audioElement.playbackRate).toBe(1);
    });

    it("clamps SET_TIME_FORWARD at the duration", () => {
      audioElement.currentTime = 95;
      handleSideEffect({ type: "SET_TIME_FORWARD", value: 10 }, audioElement);
      expect(audioElement.currentTime).toBe(100);
    });

    // The `<Seek amount={-10}>` path: it routes a negative value through
    // SET_TIME_FORWARD, which has no lower clamp of its own. This pins today's
    // reliance on the browser clamping a negative `currentTime`.
    it("has no lower clamp for a negative SET_TIME_FORWARD", () => {
      audioElement.currentTime = 5;
      handleSideEffect({ type: "SET_TIME_FORWARD", value: -10 }, audioElement);
      expect(audioElement.currentTime).toBe(-5);
    });

    it("clamps SET_TIME_BACKWARD at 0", () => {
      audioElement.currentTime = 3;
      handleSideEffect({ type: "SET_TIME_BACKWARD", value: 10 }, audioElement);
      expect(audioElement.currentTime).toBe(0);
    });

    it("goes to 0 on SET_TIME_TO_START", () => {
      audioElement.currentTime = 42;
      handleSideEffect({ type: "SET_TIME_TO_START" }, audioElement);
      expect(audioElement.currentTime).toBe(0);
    });

    it("goes to a fraction of the duration on SET_TIME_TO_PERCENT", () => {
      handleSideEffect(
        { type: "SET_TIME_TO_PERCENT", percent: 0.3 },
        audioElement,
      );
      expect(audioElement.currentTime).toBe(30);
    });
  });
});
