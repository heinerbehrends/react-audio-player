import { describe, it, expect, beforeEach } from "vitest";
import {
  handleSideEffect as handleSideEffectWithContext,
  type SideEffectContext,
} from "../../src/AudioElement/handleSideEffect";
import type { SideEffectAction } from "../../src/AudioElement/sideEffectActions";
import { createMediaElementFake } from "../store/mediaElementFake";

/**
 * The write path takes the store snapshot as an argument, so these need no
 * mock. Only `TOGGLE_MUTE` and `UNMUTE` read it; every other case leaves it at
 * the default.
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

  // The dead end `lastAudibleVolume` exists to prevent: reaching zero by any
  // path — drag, click, keyboard — and having no way back to an audible volume.
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
   * The ten keyboard actions. `handleMediaKeys.test` covers key → action; this
   * covers action → element. Every clamp here is what stands between a held-down
   * arrow key and an out-of-range media property.
   */
  /**
   * Browsers throw on out-of-range media writes rather than clamping. Measured
   * in Chrome: `volume` outside [0, 1] raises IndexSizeError, `playbackRate`
   * outside [0, 16] raises NotSupportedError, and a non-finite `currentTime`
   * raises TypeError.
   *
   * The sliders clamp by construction, so this was unreachable until
   * `useAudioPlayer` exposed `setVolume`, `setRate` and `seek` to arbitrary
   * consumer input. These rows are the guard against it coming back.
   */
  describe("out-of-range writes", () => {
    it("clamps a volume above 1 instead of throwing", () => {
      handleSideEffect(
        { type: "CHANGE_VALUE", component: "volume", value: 1.5 },
        audioElement,
      );
      expect(audioElement.volume).toBe(1);
    });

    it("clamps a volume below 0", () => {
      handleSideEffect(
        { type: "CHANGE_VALUE", component: "volume", value: -0.5 },
        audioElement,
      );
      expect(audioElement.volume).toBe(0);
    });

    it("clamps a negative playback rate to the browser's floor", () => {
      handleSideEffect(
        { type: "SET_PLAYBACK_RATE", playbackRate: -1 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(0);
    });

    it("clamps a playback rate above the browser's ceiling", () => {
      handleSideEffect(
        { type: "SET_PLAYBACK_RATE", playbackRate: 100 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(16);
    });

    /**
     * The library's own 0.5–4 policy is narrower than the browser's, and is
     * deliberately not enforced here — `<PlaybackRate.Set rate={8}>` names an
     * explicit rate and the write path should not silently override it.
     */
    it("does not impose the slider's 0.5-4 policy on an explicit rate", () => {
      handleSideEffect(
        { type: "SET_PLAYBACK_RATE", playbackRate: 8 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(8);
    });

    it("drops a non-finite seek rather than throwing", () => {
      audioElement.currentTime = 10;

      handleSideEffect(
        { type: "CHANGE_VALUE", component: "timeline", value: NaN },
        audioElement,
      );

      expect(audioElement.currentTime).toBe(10);
    });

    /**
     * `duration` is `NaN` before metadata, so both of these compute `NaN` and
     * would have thrown `TypeError` on a real element.
     */
    it("survives SET_TIME_TO_PERCENT before metadata", () => {
      const beforeMetadata = createMediaElementFake({
        duration: NaN,
        currentTime: 5,
      }) as unknown as HTMLAudioElement;

      handleSideEffect(
        { type: "SET_TIME_TO_PERCENT", percent: 0.5 },
        beforeMetadata,
      );

      expect(beforeMetadata.currentTime).toBe(5);
    });

    it("survives SET_TIME_FORWARD before metadata", () => {
      const beforeMetadata = createMediaElementFake({
        duration: NaN,
        currentTime: 5,
      }) as unknown as HTMLAudioElement;

      handleSideEffect({ type: "SET_TIME_FORWARD", value: 10 }, beforeMetadata);

      expect(beforeMetadata.currentTime).toBe(5);
    });

    it("clamps a volume nudged past 1 by the keyboard", () => {
      audioElement.volume = 0.95;

      handleSideEffect({ type: "INCREASE_VOLUME", value: 0.5 }, audioElement);

      expect(audioElement.volume).toBe(1);
    });
  });

  describe("the keyboard actions", () => {
    it("clamps INCREASE_VOLUME at 1", () => {
      audioElement.volume = 0.99;
      handleSideEffect({ type: "INCREASE_VOLUME", value: 0.025 }, audioElement);
      expect(audioElement.volume).toBe(1);
    });

    // The case returns before assigning, so the volume is left where it was and
    // only `muted` changes. Unmuting restores through `lastAudibleVolume`, not
    // through this leftover value.
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

    // `<SeekButton amount={-10}>` routes a negative value through `SET_TIME_FORWARD`,
    // which has no lower clamp of its own, so the browser's clamp on a negative
    // `currentTime` is what catches it.
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
