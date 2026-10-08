import { describe, it, expect } from "vitest";
import { createTestStore } from "./createTestStore";
import type { MediaFields } from "./mediaElementFake";

/**
 * Driven through a real store, so the context the controls read — seekable,
 * `lastAudibleVolume`, `rateRange` — comes from the fake's fields as it would
 * from a real element. The default is a loaded, seekable track with the widest
 * `rateRange`, so the engine-limit rows below stay about the engines.
 */
const WIDEST: readonly [number, number] = [0.125, 8];
/** A player whose `rateRange` is narrower than the engines allow. */
const NARROW: readonly [number, number] = [1, 2];

const setup = (
  fields: Partial<MediaFields> = {},
  rateRange: readonly [number, number] = WIDEST,
) => {
  const { store, element } = createTestStore(fields, { rateRange });
  return { controls: store.controls, element, store };
};

describe("createControls", () => {
  it("does nothing without an element", () => {
    const { store, detach } = createTestStore();
    detach();
    const { controls } = store;

    expect(() => {
      controls.play();
      controls.pause();
      controls.toggle();
      controls.stop();
      controls.seek(10);
      controls.seekBy(5);
      controls.setVolume(0.5);
      controls.adjustVolume(0.1);
      controls.setMuted(true);
      controls.toggleMute();
      controls.setRate(2);
      controls.adjustRate(0.25);
      controls.reload();
    }).not.toThrow();
  });

  it("plays and pauses", () => {
    const { controls, element } = setup();

    controls.play();
    expect(element.play).toHaveBeenCalled();

    controls.pause();
    expect(element.pause).toHaveBeenCalled();
  });

  it("toggles on the element's paused state", () => {
    const { controls, element } = setup();

    controls.toggle();
    expect(element.play).toHaveBeenCalledTimes(1);

    element.paused = false;
    controls.toggle();
    expect(element.pause).toHaveBeenCalledTimes(1);
    expect(element.play).toHaveBeenCalledTimes(1);
  });

  // jsdom and older browsers return `undefined` from `play()`.
  it("survives a play() that returns no promise", async () => {
    const { controls, element, store } = setup();
    element.play.mockReturnValue(undefined as unknown as Promise<void>);

    expect(() => controls.play()).not.toThrow();
    await Promise.resolve();

    expect(store.playbackError.get()).toBeNull();
  });

  it("stops: rewinds and pauses", () => {
    const { controls, element } = setup({ currentTime: 42 });

    controls.stop();

    expect(element.currentTime).toBe(0);
    expect(element.pause).toHaveBeenCalled();
  });

  it("toggles mute", () => {
    const { controls, element } = setup();

    controls.toggleMute();
    expect(element.muted).toBe(true);

    controls.toggleMute();
    expect(element.muted).toBe(false);
    expect(element.volume).toBe(1);
  });

  it("mutes on setMuted(true) and leaves the volume alone", () => {
    const { controls, element } = setup({ volume: 0.4 });

    controls.setMuted(true);

    expect(element.muted).toBe(true);
    expect(element.volume).toBe(0.4);
  });

  it("unmutes on setMuted(false)", () => {
    const { controls, element } = setup({ muted: true });

    controls.setMuted(false);

    expect(element.muted).toBe(false);
  });

  it("leaves an audible volume alone when unmuting", () => {
    const { controls, element } = setup({ volume: 0.8 });
    element.muted = true;
    element.volume = 0.3;

    controls.toggleMute();

    expect(element.muted).toBe(false);
    expect(element.volume).toBe(0.3);
  });

  // The dead end `lastAudibleVolume` exists to prevent: reaching zero by any
  // path — drag, click, keyboard — and having no way back to an audible volume.
  it("restores the last audible volume when unmuting a silent player", () => {
    const { controls, element } = setup({ volume: 0.8 });
    element.muted = true;
    element.volume = 0;

    controls.toggleMute();

    expect(element.muted).toBe(false);
    expect(element.volume).toBe(0.8);
  });

  it("restores the last audible volume on setMuted(false) too", () => {
    const { controls, element } = setup({ volume: 0.6 });
    controls.setVolume(0);
    expect(element.muted).toBe(true);

    controls.setMuted(false);

    expect(element.muted).toBe(false);
    expect(element.volume).toBe(0.6);
  });

  it("unmutes when the volume is set above 0", () => {
    const { controls, element } = setup({ muted: true });

    controls.setVolume(0.5);

    expect(element.muted).toBe(false);
    expect(element.volume).toBe(0.5);
  });

  it("sets the volume", () => {
    const { controls, element } = setup();
    controls.setVolume(0.7);
    expect(element.volume).toBe(0.7);
  });

  it("seeks", () => {
    const { controls, element } = setup();
    controls.seek(10);
    expect(element.currentTime).toBe(10);
  });

  it("sets the rate", () => {
    const { controls, element } = setup();
    controls.setRate(1.5);
    expect(element.playbackRate).toBe(1.5);
  });

  describe("reload", () => {
    it("reloads and plays again after play()", () => {
      const { controls, element } = setup();
      controls.play();

      controls.reload();

      expect(element.load).toHaveBeenCalledTimes(1);
      expect(element.play).toHaveBeenCalledTimes(2);
    });

    it("plays again when playback was observed rather than sent", () => {
      const { controls, element } = setup({ paused: false });

      controls.reload();

      expect(element.load).toHaveBeenCalledTimes(1);
      expect(element.play).toHaveBeenCalledTimes(1);
    });

    it("stays paused after pause()", () => {
      const { controls, element } = setup();
      controls.play();
      controls.pause();

      controls.reload();

      expect(element.load).toHaveBeenCalledTimes(1);
      expect(element.play).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Browsers throw on out-of-range media writes rather than clamping. Measured
   * in Chromium: `volume` outside [0, 1] raises IndexSizeError, `playbackRate`
   * other than `0` or [0.0625, 16] raises NotSupportedError, and a non-finite
   * `currentTime` raises TypeError. Firefox clamps the rate silently (G2), and
   * cuts the sound outside 0.125–8 (C14).
   *
   * The sliders clamp by construction; `setVolume`, `setRate` and `seek` take
   * arbitrary consumer input. These rows are the guard against it.
   */
  describe("out-of-range writes", () => {
    it("clamps a volume above 1 instead of throwing", () => {
      const { controls, element } = setup();
      controls.setVolume(1.5);
      expect(element.volume).toBe(1);
    });

    it("clamps a volume below 0", () => {
      const { controls, element } = setup();
      controls.setVolume(-0.5);
      expect(element.volume).toBe(0);
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
      ["a slider commit's 0.05", 0.05, 0.125],
      ["Firefox's silent 9", 9, 8],
      ["Chromium's throwing 16.01", 16.01, 8],
      ["100", 100, 8],
    ])("clamps %s into 0.125–8", (_name, rate, expected) => {
      const { controls, element } = setup();
      controls.setRate(rate);
      expect(element.playbackRate).toBe(expected);
    });

    it("passes the floor and the ceiling through unchanged", () => {
      const { controls, element } = setup();

      controls.setRate(0.125);
      expect(element.playbackRate).toBe(0.125);

      controls.setRate(8);
      expect(element.playbackRate).toBe(8);
    });

    /**
     * F15. One range per player: an explicit rate from `<PlaybackRate.Set>`
     * or `setRate` is clamped to it like every other write, so no control
     * reaches a rate the slider cannot show.
     */
    it("clamps an explicit rate to the player's rateRange", () => {
      const { controls, element } = setup({}, NARROW);

      controls.setRate(8);
      expect(element.playbackRate).toBe(2);

      controls.setRate(0.5);
      expect(element.playbackRate).toBe(1);
    });

    it("drops a non-finite rate", () => {
      const { controls, element } = setup({ playbackRate: 1.5 });
      controls.setRate(NaN);
      expect(element.playbackRate).toBe(1.5);
    });

    it("drops a non-finite volume", () => {
      const { controls, element } = setup({ volume: 0.4 });
      controls.setVolume(NaN);
      expect(element.volume).toBe(0.4);
    });

    it("drops a non-finite seek rather than throwing", () => {
      const { controls, element } = setup({ currentTime: 10 });
      controls.seek(NaN);
      expect(element.currentTime).toBe(10);
    });

    /**
     * `duration` is `NaN` before metadata, so a seek to a fraction of it, or a
     * step clamped to it, computes `NaN` and would throw `TypeError` on a real
     * element.
     */
    it("survives a seek to a fraction of the duration before metadata", () => {
      const { controls, element } = setup({ duration: NaN, currentTime: 5 });
      controls.seek(element.duration * 0.5);
      expect(element.currentTime).toBe(5);
    });

    it("survives seekBy before metadata", () => {
      const { controls, element } = setup({ duration: NaN, currentTime: 5 });
      controls.seekBy(10);
      expect(element.currentTime).toBe(5);
    });

    // A live stream's `Infinity` would let `Math.min(currentTime + 10, duration)`
    // through, so the gate has to come before the sum.
    it.each([
      ["seek", (c: ReturnType<typeof setup>["controls"]) => c.seek(0)],
      [
        "seekBy forward",
        (c: ReturnType<typeof setup>["controls"]) => c.seekBy(10),
      ],
      [
        "seekBy back",
        (c: ReturnType<typeof setup>["controls"]) => c.seekBy(-10),
      ],
    ])("leaves a live stream where it is on %s", (_name, act) => {
      const { controls, element } = setup({
        duration: Infinity,
        currentTime: 30,
      });
      act(controls);
      expect(element.currentTime).toBe(30);
    });

    // `seek()` and the `s` key reach these too, not only the timeline.
    it("leaves an unseekable source where it is on a seek", () => {
      const { controls, element } = setup({ duration: NaN, currentTime: 10 });
      controls.seek(0);
      expect(element.currentTime).toBe(10);
    });

    it("pauses an unseekable source on stop without a rewind", () => {
      const { controls, element } = setup({ duration: NaN, currentTime: 10 });

      controls.stop();

      expect(element.currentTime).toBe(10);
      expect(element.pause).toHaveBeenCalled();
    });

    it("clamps a volume nudged past 1", () => {
      const { controls, element } = setup({ volume: 0.95 });
      controls.adjustVolume(0.5);
      expect(element.volume).toBe(1);
    });
  });

  describe("the step verbs", () => {
    it("clamps adjustVolume at 1", () => {
      const { controls, element } = setup({ volume: 0.99 });
      controls.adjustVolume(0.025);
      expect(element.volume).toBe(1);
    });

    // Returns before assigning, so the volume is left where it was and only
    // `muted` changes. Unmuting restores through `lastAudibleVolume`, not
    // through this leftover value.
    it("mutes on a decrease to near-zero and leaves volume untouched", () => {
      const { controls, element } = setup({ volume: 0.02 });
      controls.adjustVolume(-0.025);
      expect(element.muted).toBe(true);
      expect(element.volume).toBe(0.02);
    });

    // Only `setVolume` and the mute verbs unmute; a nudge up changes the level
    // the player will return to.
    it("does not unmute on an increase", () => {
      const { controls, element } = setup({ volume: 0.5, muted: true });
      controls.adjustVolume(0.1);
      expect(element.muted).toBe(true);
      expect(element.volume).toBeCloseTo(0.6);
    });

    it("clamps adjustRate at 8", () => {
      const { controls, element } = setup({ playbackRate: 7.99 });
      controls.adjustRate(0.05);
      expect(element.playbackRate).toBe(8);
    });

    it("clamps adjustRate at 0.125", () => {
      const { controls, element } = setup({ playbackRate: 0.15 });
      controls.adjustRate(-0.05);
      expect(element.playbackRate).toBe(0.125);
    });

    /**
     * F15. A rate outside the range can only have been written through
     * `audioRef`. A step pulls it back to the nearer end, whichever way the
     * step points: with one range per player there is no narrower control
     * whose end would be the wrong place to land, which was the case C14's
     * direction rule existed for.
     */
    it.each([
      ["an increase past the ceiling", 0.25, 3, NARROW, 2],
      ["a decrease below the floor", -0.25, 0.75, NARROW, 1],
      ["an increase from above the limits", 0.25, 16, WIDEST, 8],
      ["a decrease from below the limits", -0.25, 0.0625, WIDEST, 0.125],
    ] as const)(
      "pulls %s back into the range",
      (_name, delta, from, rateRange, expected) => {
        const { controls, element } = setup({}, rateRange);
        element.playbackRate = from;
        controls.adjustRate(delta);
        expect(element.playbackRate).toBe(expected);
      },
    );

    it("does nothing on a step of 0", () => {
      const { controls, element } = setup({ playbackRate: 8 });
      controls.adjustRate(0);
      expect(element.playbackRate).toBe(8);
    });

    it("stops a step at the player's rateRange", () => {
      const { controls, element } = setup({}, NARROW);

      element.playbackRate = 1.99;
      controls.adjustRate(0.05);
      expect(element.playbackRate).toBe(2);

      element.playbackRate = 1.01;
      controls.adjustRate(-0.05);
      expect(element.playbackRate).toBe(1);
    });

    it("resets the rate to 1", () => {
      const { controls, element } = setup({ playbackRate: 2.5 });
      controls.setRate(1);
      expect(element.playbackRate).toBe(1);
    });

    it("resets to the nearest end of a range that excludes 1x", () => {
      const { controls, element } = setup({ playbackRate: 2 }, [1.5, 3]);
      controls.setRate(1);
      expect(element.playbackRate).toBe(1.5);
    });

    it("clamps a forward seekBy at the duration", () => {
      const { controls, element } = setup({ currentTime: 95 });
      controls.seekBy(10);
      expect(element.currentTime).toBe(100);
    });

    it("clamps a backward seekBy at 0", () => {
      const { controls, element } = setup({ currentTime: 3 });
      controls.seekBy(-10);
      expect(element.currentTime).toBe(0);
    });

    it("goes to the start on seek(0)", () => {
      const { controls, element } = setup({ currentTime: 42 });
      controls.seek(0);
      expect(element.currentTime).toBe(0);
    });

    it("goes to a fraction of the duration", () => {
      const { controls, element } = setup();
      controls.seek(element.duration * 0.3);
      expect(element.currentTime).toBe(30);
    });
  });
});
