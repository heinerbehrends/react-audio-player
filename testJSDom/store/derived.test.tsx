import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "@testing-library/react";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import {
  useIsBuffering,
  useIsDisabled,
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
  it("is true while loading and on error, false once ready", () => {
    const harness = renderDerived(useIsDisabled, { readyState: 0 });
    expect(harness.result.current).toBe(true);

    drive(harness, "loadedmetadata", { readyState: 1 });
    expect(harness.result.current).toBe(false);

    drive(harness, "error", { error: {} as MediaError });
    expect(harness.result.current).toBe(true);
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
