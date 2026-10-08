import { describe, it, expect, beforeEach } from "vitest";
import {
  handleSideEffect as handleSideEffectWithContext,
  type SideEffectContext,
} from "../../src/AudioElement/handleSideEffect";
import {
  RATE_LIMITS,
  type SideEffectAction,
} from "../../src/AudioElement/sideEffectActions";
import { createMediaElementFake } from "../store/mediaElementFake";

/**
 * The write path takes the store snapshot as an argument, so these need no
 * mock. The default is a loaded, seekable track with the widest `rateRange`,
 * so the engine-limit rows below stay about the engines.
 */
const defaultContext: SideEffectContext = {
  lastAudibleVolume: 1,
  isSeekable: true,
  rateRange: RATE_LIMITS,
};
/** Before metadata, or a live stream: the store's duration is 0. */
const unseekable: SideEffectContext = { ...defaultContext, isSeekable: false };
/** A player whose `rateRange` is narrower than the engines allow. */
const narrow: SideEffectContext = {
  ...defaultContext,
  rateRange: { minValue: 1, maxValue: 2 },
};

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
    expect(() => handleSideEffect({ type: "TOGGLE_PLAY" }, null)).not.toThrow();
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
      ...defaultContext,
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
      ...defaultContext,
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
      ...defaultContext,
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
      { type: "CHANGE_VALUE", component: "rate", value: 1.5 },
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
   * in Chromium: `volume` outside [0, 1] raises IndexSizeError, `playbackRate`
   * other than `0` or [0.0625, 16] raises NotSupportedError, and a non-finite
   * `currentTime` raises TypeError. Firefox clamps the rate silently (G2), and
   * cuts the sound outside 0.125–8 (C14).
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

    /**
     * C14. Every rate write clamps to the player's `rateRange`, and the widest
     * one is `RATE_LIMITS`, 0.125–8: the range that stays audible in Firefox,
     * and inside Chromium's 0.0625–16, so it also covers G2's throwing values.
     */
    it.each([
      ["a negative rate", -1, 0.125],
      ["0, which pause replaces", 0, 0.125],
      ["Chromium's throwing 0.01", 0.01, 0.125],
      ["Firefox's silent 0.1", 0.1, 0.125],
      ["Firefox's silent 9", 9, 8],
      ["Chromium's throwing 16.01", 16.01, 8],
      ["100", 100, 8],
    ])("clamps %s into 0.125–8", (_name, rate, expected) => {
      handleSideEffect(
        { type: "SET_PLAYBACK_RATE", playbackRate: rate },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(expected);
    });

    it("passes the floor and the ceiling through unchanged", () => {
      handleSideEffect(
        { type: "SET_PLAYBACK_RATE", playbackRate: 0.125 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(0.125);

      handleSideEffect(
        { type: "SET_PLAYBACK_RATE", playbackRate: 8 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(8);
    });

    it("clamps a slider commit below the floor too", () => {
      handleSideEffect(
        { type: "CHANGE_VALUE", component: "rate", value: 0.05 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(0.125);
    });

    /**
     * F15. One range per player: an explicit rate from `<PlaybackRate.Set>`
     * or `setRate` is clamped to it like every other write, so no control
     * reaches a rate the slider cannot show.
     */
    it("clamps an explicit rate to the player's rateRange", () => {
      handleSideEffect(
        { type: "SET_PLAYBACK_RATE", playbackRate: 8 },
        audioElement,
        narrow,
      );
      expect(audioElement.playbackRate).toBe(2);

      handleSideEffect(
        { type: "CHANGE_VALUE", component: "rate", value: 0.5 },
        audioElement,
        narrow,
      );
      expect(audioElement.playbackRate).toBe(1);
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
        unseekable,
      );

      expect(beforeMetadata.currentTime).toBe(5);
    });

    it("survives SET_TIME_FORWARD before metadata", () => {
      const beforeMetadata = createMediaElementFake({
        duration: NaN,
        currentTime: 5,
      }) as unknown as HTMLAudioElement;

      handleSideEffect(
        { type: "SET_TIME_FORWARD", value: 10 },
        beforeMetadata,
        unseekable,
      );

      expect(beforeMetadata.currentTime).toBe(5);
    });

    // `seek()` and the `s` key reach these too, not only the timeline.
    it("leaves an unseekable source where it is on a timeline write", () => {
      audioElement.currentTime = 10;

      handleSideEffect(
        { type: "CHANGE_VALUE", component: "timeline", value: 0 },
        audioElement,
        unseekable,
      );

      expect(audioElement.currentTime).toBe(10);
    });

    it("pauses an unseekable source on STOP_AUDIO without a rewind", () => {
      audioElement.currentTime = 10;

      handleSideEffect({ type: "STOP_AUDIO" }, audioElement, unseekable);

      expect(audioElement.currentTime).toBe(10);
      expect(audioElement.pause).toHaveBeenCalled();
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

    it("clamps INCREASE_PLAYBACK_RATE at 8", () => {
      audioElement.playbackRate = 7.99;
      handleSideEffect(
        { type: "INCREASE_PLAYBACK_RATE", value: 0.05 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(8);
    });

    it("clamps DECREASE_PLAYBACK_RATE at 0.125", () => {
      audioElement.playbackRate = 0.15;
      handleSideEffect(
        { type: "DECREASE_PLAYBACK_RATE", value: 0.05 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(0.125);
    });

    /**
     * F15. A rate outside the range can only have been written through
     * `audioRef`. A step pulls it back to the nearer end, whichever way the
     * step points: with one range per player there is no narrower control
     * whose end would be the wrong place to land, which was the case C14's
     * direction rule existed for.
     */
    it.each([
      ["an increase past the ceiling", "INCREASE", 3, narrow, 2],
      ["a decrease below the floor", "DECREASE", 0.75, narrow, 1],
      ["an increase from above the limits", "INCREASE", 16, defaultContext, 8],
      [
        "a decrease from below the limits",
        "DECREASE",
        0.0625,
        defaultContext,
        0.125,
      ],
    ] as const)(
      "pulls %s back into the range",
      (_name, direction, from, context, expected) => {
        audioElement.playbackRate = from;
        handleSideEffect(
          { type: `${direction}_PLAYBACK_RATE`, value: 0.25 },
          audioElement,
          context,
        );
        expect(audioElement.playbackRate).toBe(expected);
      },
    );

    it("does nothing on a step of 0", () => {
      audioElement.playbackRate = 8;
      handleSideEffect(
        { type: "INCREASE_PLAYBACK_RATE", value: 0 },
        audioElement,
      );
      expect(audioElement.playbackRate).toBe(8);
    });

    it("stops a step at the player's rateRange", () => {
      audioElement.playbackRate = 1.99;
      handleSideEffect(
        { type: "INCREASE_PLAYBACK_RATE", value: 0.05 },
        audioElement,
        narrow,
      );
      expect(audioElement.playbackRate).toBe(2);

      audioElement.playbackRate = 1.01;
      handleSideEffect(
        { type: "DECREASE_PLAYBACK_RATE", value: 0.05 },
        audioElement,
        narrow,
      );
      expect(audioElement.playbackRate).toBe(1);
    });

    it("resets the rate to 1 on RESET_PLAYBACK_RATE", () => {
      audioElement.playbackRate = 2.5;
      handleSideEffect({ type: "RESET_PLAYBACK_RATE" }, audioElement);
      expect(audioElement.playbackRate).toBe(1);
    });

    it("resets to the nearest end of a range that excludes 1x", () => {
      audioElement.playbackRate = 2;
      handleSideEffect({ type: "RESET_PLAYBACK_RATE" }, audioElement, {
        ...defaultContext,
        rateRange: { minValue: 1.5, maxValue: 3 },
      });
      expect(audioElement.playbackRate).toBe(1.5);
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
