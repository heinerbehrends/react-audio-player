import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "@testing-library/react";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import {
  useIsAtEnd,
  useIsBuffering,
  useIsDisabled,
  useIsSeekable,
  usePlayerState,
  useTimeDisplay,
  useVolumeState,
} from "../../src/store/derived";
import { createTestStore, type TestStore } from "./createTestStore";
import type { MediaFields } from "./mediaElementFake";

function renderDerived<T>(hook: () => T, element: Partial<MediaFields> = {}) {
  const harness = createTestStore(element);
  const result = renderHook(hook, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <PlayerStoreProvider store={harness.store}>
        {children}
      </PlayerStoreProvider>
    ),
  });
  return { ...result, ...harness };
}

/** Assign a field on the fake, then emit the event a browser would. */
function drive(
  harness: TestStore,
  event: string,
  fields: Partial<MediaFields>,
) {
  act(() => {
    Object.assign(harness.element, fields);
    harness.element.emit(event);
  });
}

describe("usePlayerState", () => {
  it("reports 'loading' before metadata, whatever paused says", () => {
    const { result } = renderDerived(usePlayerState, {
      readyState: 0,
      paused: false,
    });
    expect(result.current).toBe("loading");
  });

  it("reports 'error' when the element carries one", () => {
    const { result } = renderDerived(usePlayerState, {
      error: {} as MediaError,
    });
    expect(result.current).toBe("error");
  });

  it("reports 'paused' and 'playing' off `paused` once ready", () => {
    const harness = renderDerived(usePlayerState, { readyState: 1 });
    expect(harness.result.current).toBe("paused");

    drive(harness, "play", { paused: false });
    expect(harness.result.current).toBe("playing");

    drive(harness, "pause", { paused: true });
    expect(harness.result.current).toBe("paused");
  });

  it("stays correct across a src swap while playing", () => {
    const harness = renderDerived(usePlayerState, {
      readyState: 1,
      paused: false,
    });
    expect(harness.result.current).toBe("playing");

    // The media load algorithm pauses the element without firing `pause`, and
    // fires `emptied` — which re-primes rather than toggling.
    drive(harness, "emptied", { paused: true, readyState: 0 });
    expect(harness.result.current).toBe("loading");
  });
});

describe("useVolumeState", () => {
  it("is 'muted' whenever the element is muted, whatever the volume", () => {
    const { result } = renderDerived(useVolumeState, {
      muted: true,
      volume: 1,
    });
    expect(result.current).toBe("muted");
  });

  it("is 'muted' for a volume a hair off zero", () => {
    const { result } = renderDerived(useVolumeState, { volume: 0.0005 });
    expect(result.current).toBe("muted");
  });

  it("switches from 'low' to 'high' at 0.5", () => {
    const harness = renderDerived(useVolumeState, { volume: 0.4 });
    expect(harness.result.current).toBe("low");

    drive(harness, "volumechange", { volume: 0.49 });
    expect(harness.result.current).toBe("low");

    drive(harness, "volumechange", { volume: 0.5 });
    expect(harness.result.current).toBe("high");

    drive(harness, "volumechange", { volume: 0.6 });
    expect(harness.result.current).toBe("high");
  });
});

describe("useIsDisabled", () => {
  it("is true on an error and false once the element recovers", () => {
    const harness = renderDerived(useIsDisabled, {
      error: {} as MediaError,
    });
    expect(harness.result.current).toBe(true);

    drive(harness, "loadedmetadata", { error: null, readyState: 1 });
    expect(harness.result.current).toBe(false);
  });

  /**
   * The point of the split. `play()` at `readyState: 0` is legal and the browser
   * queues it, and a `src` change re-enters loading — so disabling here would
   * swallow the first press on every playlist advance.
   */
  it("is false while merely loading", () => {
    const harness = renderDerived(useIsDisabled, { readyState: 0 });

    expect(harness.result.current).toBe(false);
  });

  /**
   * `loadState` sees a `MediaError` but not a `playbackError`, and that is
   * deliberate: a user gesture is what lifts an autoplay refusal, and a disabled
   * Play button makes that gesture impossible.
   */
  it("is false after a refused play(), which leaves the resource fine", () => {
    const harness = renderDerived(useIsDisabled, { readyState: 1 });
    harness.element.play.mockRejectedValueOnce(
      new DOMException("blocked", "NotAllowedError"),
    );

    expect(harness.result.current).toBe(false);
  });
});

/**
 * Keyed on the range rather than on the load state, which folds two cases into
 * one: a player before `loadedmetadata`, and a live stream whose `readyState` is
 * healthy and whose duration is `Infinity`. No load-state check reaches the
 * second, which is why this exists rather than a `loadState !== "ready"` test.
 */
describe("useIsSeekable", () => {
  it("is true once the duration is known", () => {
    const { result } = renderDerived(useIsSeekable, { duration: 100 });

    expect(result.current).toBe(true);
  });

  /**
   * `finite()` in `syncFromElement` maps `NaN` and `Infinity` to 0, so the atom
   * holds neither and `duration > 0` is the whole test. These rows pin that
   * coupling: remove `finite()` and the `Infinity` row fails, since
   * `Infinity > 0`.
   */
  it.each([
    ["a duration that has not arrived", NaN],
    ["a live stream, whose duration is Infinity", Infinity],
    ["a zero-length resource", 0],
  ])("is false for %s", (_label, duration) => {
    const { result } = renderDerived(useIsSeekable, { duration });

    expect(result.current).toBe(false);
  });

  it("follows a durationchange", () => {
    const harness = renderDerived(useIsSeekable, { duration: NaN });
    expect(harness.result.current).toBe(false);

    drive(harness, "durationchange", { duration: 42 });
    expect(harness.result.current).toBe(true);
  });

  /**
   * The two predicates are independent: a healthy live stream is not seekable,
   * and an errored file with a known duration is disabled but still has a range.
   */
  it("is independent of the load state", () => {
    const streaming = renderDerived(useIsSeekable, {
      readyState: 4,
      duration: Infinity,
    });
    expect(streaming.result.current).toBe(false);

    const errored = renderDerived(useIsSeekable, {
      error: {} as MediaError,
      duration: 100,
    });
    expect(errored.result.current).toBe(true);
  });
});

/**
 * `loadState` reaches `"ready"` at `HAVE_METADATA`, which means the duration is
 * known, not that the element can play. Without this derivation a mid-track
 * stall leaves `paused === false`, so the UI shows Pause while nothing comes out
 * of the speakers.
 */
describe("useIsBuffering", () => {
  it("is true when playback is stalled below the playable rung", () => {
    const { result } = renderDerived(useIsBuffering, {
      readyState: 1,
      paused: false,
    });

    expect(result.current).toBe(true);
  });

  it("is false once the element has data to advance", () => {
    const { result } = renderDerived(useIsBuffering, {
      readyState: 3,
      paused: false,
    });

    expect(result.current).toBe(false);
  });

  it("is false while paused, however little is buffered", () => {
    const { result } = renderDerived(useIsBuffering, {
      readyState: 1,
      paused: true,
    });

    expect(result.current).toBe(false);
  });

  it("is false before metadata — that is loading, not buffering", () => {
    const { result } = renderDerived(useIsBuffering, {
      readyState: 0,
      paused: false,
    });

    expect(result.current).toBe(false);
  });

  it("stays false for an errored element", () => {
    const { result } = renderDerived(useIsBuffering, {
      readyState: 1,
      paused: false,
      error: {} as MediaError,
    });

    expect(result.current).toBe(false);
  });

  it("follows the element as it stalls and recovers", () => {
    const { result, element } = renderDerived(useIsBuffering, {
      readyState: 4,
      paused: false,
    });

    expect(result.current).toBe(false);

    act(() => {
      element.readyState = 1;
      element.emit("waiting");
    });
    expect(result.current).toBe(true);

    act(() => {
      element.readyState = 4;
      element.emit("playing");
    });
    expect(result.current).toBe(false);
  });

  /**
   * A stalled player is still in play mode, so the button must still offer
   * Pause.
   */
  it("leaves playerState reporting 'playing' throughout a stall", () => {
    const { result, element } = renderDerived(
      () => ({ state: usePlayerState(), buffering: useIsBuffering() }),
      { readyState: 4, paused: false },
    );

    act(() => {
      element.readyState = 1;
      element.emit("waiting");
    });

    expect(result.current.buffering).toBe(true);
    expect(result.current.state).toBe("playing");
  });
});

describe("useTimeDisplay", () => {
  it("reports the elapsed and the remaining time", () => {
    const { result } = renderDerived(useTimeDisplay, {
      currentTime: 30,
      duration: 100,
    });

    expect(result.current).toEqual({ elapsed: 30, remaining: 70 });
  });

  /**
   * Both halves come off `currentSecond`, the store's 1 Hz clock, so a
   * sub-second `currentTime` reads as the whole second below it — and the two
   * always sum to the duration rather than drifting apart.
   */
  it("quantises both halves to the same whole second", () => {
    const { result } = renderDerived(useTimeDisplay, {
      currentTime: 30.9,
      duration: 100,
    });

    expect(result.current).toEqual({ elapsed: 30, remaining: 70 });
  });

  it("follows a timeupdate", () => {
    const { result, ...harness } = renderDerived(useTimeDisplay, {
      currentTime: 0,
      duration: 100,
    });

    drive(harness, "timeupdate", { currentTime: 42 });

    expect(result.current).toEqual({ elapsed: 42, remaining: 58 });
  });

  /**
   * The clamp. `currentSecond` can pass `duration`: the element fires a last
   * `timeupdate` at the very end, and `duration` is `NaN` until metadata
   * arrives, which would otherwise render as "-NaN" or a negative countdown.
   */
  it.each([
    ["currentTime past the duration", { currentTime: 101, duration: 100 }],
    ["a duration that is still NaN", { currentTime: 5, duration: NaN }],
  ])("holds remaining at zero with %s", (_label, element) => {
    const { result } = renderDerived(useTimeDisplay, element);

    expect(result.current.remaining).toBe(0);
  });
});

/**
 * Position, not history: it says "the playhead is at the end", which is why it
 * needs no clearing and cannot go stale across a `src` change. `onEnded` is the
 * edge; this is the level.
 */
describe("useIsAtEnd", () => {
  it("is false mid-track and true at the end", () => {
    const harness = renderDerived(useIsAtEnd, {
      duration: 100,
      currentTime: 50,
    });
    expect(harness.result.current).toBe(false);

    drive(harness, "timeupdate", { currentTime: 100 });
    expect(harness.result.current).toBe(true);
  });

  /**
   * A browser parks slightly *past* `duration` when playback ends — Chrome
   * reports about 0.5 s beyond. So the test is `>=`, not an approximate match:
   * a 0.001 tolerance reads false at exactly the moment the track finishes.
   */
  it("is true when the element parks past the duration", () => {
    const { result } = renderDerived(useIsAtEnd, {
      duration: 283.333333,
      currentTime: 283.807869,
    });

    expect(result.current).toBe(true);
  });

  it("clears as soon as the position moves off the end", () => {
    const harness = renderDerived(useIsAtEnd, {
      duration: 100,
      currentTime: 100,
    });
    expect(harness.result.current).toBe(true);

    drive(harness, "seeked", { currentTime: 0 });
    expect(harness.result.current).toBe(false);
  });

  /** No duration, no end: before metadata, and on a live stream. */
  it.each([
    ["a duration that has not arrived", NaN],
    ["a live stream", Infinity],
  ])("is false with %s", (_label, duration) => {
    const { result } = renderDerived(useIsAtEnd, { duration, currentTime: 30 });

    expect(result.current).toBe(false);
  });

  /**
   * The `ended` event projects the position as well as `paused`. Without that
   * this would race the final `timeupdate`, which is not ordered against it.
   */
  it("sees the end from the ended event alone", () => {
    const harness = renderDerived(useIsAtEnd, {
      duration: 100,
      currentTime: 50,
    });

    drive(harness, "ended", { currentTime: 100.4, paused: true });

    expect(harness.result.current).toBe(true);
  });
});
