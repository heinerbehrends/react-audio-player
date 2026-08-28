import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  useAudioPlayer,
  useCurrentSecond,
  useCurrentTime,
} from "../../src/store/useAudioPlayer";
import { createTestStore, type TestStore } from "./createTestStore";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import { PlayerConfigProvider } from "../../src/Player/PlayerConfigContext";

function wrapperFor(harness: TestStore) {
  return ({ children }: { children: React.ReactNode }) => (
    <PlayerStoreProvider store={harness.store}>
      <PlayerConfigProvider
        audioFile={{ src: "test-audio.mp3" }}
        customKeyboardShortcuts={undefined}
      >
        {children}
      </PlayerConfigProvider>
    </PlayerStoreProvider>
  );
}

const setup = <T,>(hook: () => T, fields = {}) => {
  const harness = createTestStore({ readyState: 1, ...fields });
  const view = renderHook(hook, { wrapper: wrapperFor(harness) });
  return { harness, ...view };
};

describe("useAudioPlayer", () => {
  it("reads the projected state off the element", () => {
    const { result } = setup(useAudioPlayer, {
      duration: 120,
      volume: 0.4,
      muted: false,
      playbackRate: 1.5,
      paused: true,
    });

    expect(result.current.duration).toBe(120);
    expect(result.current.volume).toBe(0.4);
    expect(result.current.rate).toBe(1.5);
    expect(result.current.paused).toBe(true);
    expect(result.current.playerState).toBe("paused");
    expect(result.current.volumeState).toBe("low");
    expect(result.current.isDisabled).toBe(false);
  });

  it("reports loading and error ahead of paused/playing", () => {
    const loading = setup(useAudioPlayer, { readyState: 0 });
    expect(loading.result.current.playerState).toBe("loading");

    const errored = setup(useAudioPlayer, { error: {} as MediaError });
    expect(errored.result.current.playerState).toBe("error");
  });

  /**
   * `isDisabled` and `isSeekable` are inlined here rather than calling the two
   * hooks, so they can drift from `useIsDisabled` / `useIsSeekable`. These rows
   * are what would catch that — a consumer building custom controls needs the
   * same two predicates the library's own components read.
   */
  it("reports isDisabled for an error only, not for loading", () => {
    expect(
      setup(useAudioPlayer, { readyState: 0, duration: 0 }).result.current
        .isDisabled,
    ).toBe(false);

    expect(
      setup(useAudioPlayer, { error: {} as MediaError }).result.current
        .isDisabled,
    ).toBe(true);
  });

  it("reports isSeekable off the duration, independent of the load state", () => {
    expect(
      setup(useAudioPlayer, { readyState: 0, duration: 0 }).result.current
        .isSeekable,
    ).toBe(false);

    // A healthy live stream: `readyState` at its maximum, no end to seek to.
    expect(
      setup(useAudioPlayer, { readyState: 4, duration: Infinity }).result
        .current.isSeekable,
    ).toBe(false);

    expect(
      setup(useAudioPlayer, { readyState: 1, duration: 100 }).result.current
        .isSeekable,
    ).toBe(true);
  });

  it("tracks the element as it changes", () => {
    const { result, harness } = setup(useAudioPlayer, { paused: true });

    expect(result.current.playerState).toBe("paused");

    act(() => {
      harness.element.paused = false;
      harness.element.emit("play");
    });

    expect(result.current.playerState).toBe("playing");
    expect(result.current.paused).toBe(false);
  });

  /**
   * The controls are a public API a consumer will put in a dependency array, so
   * an unstable identity would re-fire their effects on every store update.
   */
  it("returns control methods with a stable identity across updates", () => {
    const { result, harness } = setup(useAudioPlayer);
    const first = result.current.play;

    act(() => {
      harness.element.paused = false;
      harness.element.emit("play");
    });

    expect(result.current.play).toBe(first);
    expect(result.current.toggle).toBeTypeOf("function");
  });

  it("drives the element through the write path", () => {
    const { result, harness } = setup(useAudioPlayer, { duration: 100 });

    act(() => result.current.play());
    expect(harness.element.play).toHaveBeenCalled();

    act(() => result.current.pause());
    expect(harness.element.pause).toHaveBeenCalled();

    act(() => result.current.seek(42));
    expect(harness.element.currentTime).toBe(42);

    act(() => result.current.setVolume(0.25));
    expect(harness.element.volume).toBe(0.25);

    act(() => result.current.setRate(2));
    expect(harness.element.playbackRate).toBe(2);
  });

  it("seeks relatively in both directions, clamped by the write path", () => {
    const { result, harness } = setup(useAudioPlayer, {
      duration: 100,
      currentTime: 50,
    });

    act(() => result.current.seekBy(10));
    expect(harness.element.currentTime).toBe(60);

    act(() => result.current.seekBy(-25));
    expect(harness.element.currentTime).toBe(35);
  });

  it("couples mute to a zero volume, as the slider does", () => {
    const { result, harness } = setup(useAudioPlayer, { volume: 0.8 });

    act(() => result.current.setVolume(0));

    expect(harness.element.muted).toBe(true);
  });

  it("reports isBuffering, orthogonally to playerState", () => {
    const { result, harness } = setup(useAudioPlayer, {
      readyState: 4,
      paused: false,
    });

    expect(result.current.isBuffering).toBe(false);

    act(() => {
      harness.element.readyState = 1;
      harness.element.emit("waiting");
    });

    expect(result.current.isBuffering).toBe(true);
    expect(result.current.playerState).toBe("playing");
  });

  /**
   * Why the hook is split in three: `currentTime` fires ~4x/second, so folding
   * it in would re-render every consumer at that rate, including ones that only
   * read a track title.
   */
  it("does not re-render when only currentTime changes", () => {
    const harness = createTestStore({ readyState: 1, duration: 100 });
    const renders = vi.fn();
    renderHook(
      () => {
        renders();
        return useAudioPlayer();
      },
      { wrapper: wrapperFor(harness) },
    );

    const before = renders.mock.calls.length;

    act(() => {
      harness.element.currentTime = 1.25;
      harness.element.emit("timeupdate");
      harness.element.currentTime = 1.5;
      harness.element.emit("timeupdate");
    });

    expect(renders.mock.calls.length).toBe(before);
  });
});

describe("useCurrentSecond / useCurrentTime", () => {
  it("useCurrentTime follows the raw position", () => {
    const { result, harness } = setup(useCurrentTime);

    act(() => {
      harness.element.currentTime = 3.75;
      harness.element.emit("timeupdate");
    });

    expect(result.current).toBe(3.75);
  });

  it("useCurrentSecond quantises, and holds still within a second", () => {
    const harness = createTestStore({ readyState: 1 });
    const renders = vi.fn();
    const { result } = renderHook(
      () => {
        renders();
        return useCurrentSecond();
      },
      { wrapper: wrapperFor(harness) },
    );

    act(() => {
      harness.element.currentTime = 3.25;
      harness.element.emit("timeupdate");
    });
    expect(result.current).toBe(3);

    const afterFirst = renders.mock.calls.length;

    // Three more updates inside the same second must not wake the subscriber.
    act(() => {
      for (const t of [3.5, 3.75, 3.99]) {
        harness.element.currentTime = t;
        harness.element.emit("timeupdate");
      }
    });

    expect(result.current).toBe(3);
    expect(renders.mock.calls.length).toBe(afterFirst);
  });
});
