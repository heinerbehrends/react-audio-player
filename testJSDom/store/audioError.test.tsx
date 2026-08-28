import { describe, it, expect, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAudioError } from "../../src/store/derived";
import { PlayerStoreProvider } from "../../src/store/PlayerStoreContext";
import { createTestStore, type TestStore } from "./createTestStore";
import type { MediaFields } from "./mediaElementFake";

function render(harness: TestStore) {
  return renderHook(useAudioError, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <PlayerStoreProvider store={harness.store}>
        {children}
      </PlayerStoreProvider>
    ),
  });
}

const setup = (fields: Partial<MediaFields> = {}) => {
  const harness = createTestStore({ readyState: 1, ...fields });
  return { harness, ...render(harness) };
};

/** `MediaError.code` is a numeric enum; the store projects the number. */
const mediaError = (code: number) => ({ code }) as MediaError;

describe("useAudioError — media errors (F8)", () => {
  it("is null for a healthy element", () => {
    expect(setup().result.current).toBeNull();
  });

  it.each([
    [1, "aborted"],
    [2, "network"],
    [3, "decode"],
    [4, "unsupported"],
  ])("maps MediaError code %i to %s", (code, reason) => {
    const { result } = setup({ error: mediaError(code) });

    expect(result.current).toEqual({ kind: "media", reason });
  });

  it("falls back to 'unknown' for a code it does not recognise", () => {
    const { result } = setup({ error: mediaError(99) });

    expect(result.current).toEqual({ kind: "media", reason: "unknown" });
  });

  /**
   * The reason F8 exists: before this, every failure collapsed to
   * `loadState: "error"` and a consumer could not tell a retryable network
   * error from a source the browser will never play.
   */
  it("distinguishes a retryable network error from an unusable source", () => {
    expect(setup({ error: mediaError(2) }).result.current).toEqual({
      kind: "media",
      reason: "network",
    });
    expect(setup({ error: mediaError(4) }).result.current).toEqual({
      kind: "media",
      reason: "unsupported",
    });
  });

  it("clears when a new source loads", () => {
    const { result, harness } = setup({ error: mediaError(2) });
    expect(result.current).not.toBeNull();

    act(() => {
      harness.element.error = null;
      harness.element.emit("loadstart");
    });

    expect(result.current).toBeNull();
  });
});

describe("useAudioError — refused playback (F4)", () => {
  const refuse = (harness: TestStore, name: string) => {
    const rejection = Object.assign(new Error(name), { name });
    harness.element.play.mockReturnValue(Promise.reject(rejection));
  };

  it("records a blocked autoplay", async () => {
    const { result, harness } = setup();
    refuse(harness, "NotAllowedError");

    act(() => harness.store.send({ type: "PLAY" }));

    await waitFor(() =>
      expect(result.current).toEqual({
        kind: "playback",
        reason: "NotAllowedError",
      }),
    );
  });

  /**
   * A double-click, or `p` held down with key repeat, produces exactly this.
   * The user's intent was honoured, so it is not a failure to report.
   */
  it("ignores an AbortError", async () => {
    const { result, harness } = setup();
    refuse(harness, "AbortError");

    act(() => harness.store.send({ type: "PLAY" }));
    await act(() => Promise.resolve());

    expect(result.current).toBeNull();
  });

  it("records a refusal from TOGGLE_PLAY too", async () => {
    const { result, harness } = setup({ paused: true });
    refuse(harness, "NotAllowedError");

    act(() => harness.store.send({ type: "TOGGLE_PLAY" }));

    await waitFor(() => expect(result.current).not.toBeNull());
  });

  it("clears once a play finally succeeds", async () => {
    const { result, harness } = setup();
    refuse(harness, "NotAllowedError");

    act(() => harness.store.send({ type: "PLAY" }));
    await waitFor(() => expect(result.current).not.toBeNull());

    harness.element.play.mockReturnValue(Promise.resolve());
    act(() => harness.store.send({ type: "PLAY" }));

    await waitFor(() => expect(result.current).toBeNull());
  });

  it("names an unrecognisable rejection rather than throwing", async () => {
    const { result, harness } = setup();
    harness.element.play.mockReturnValue(Promise.reject(undefined));

    act(() => harness.store.send({ type: "PLAY" }));

    await waitFor(() =>
      expect(result.current).toEqual({
        kind: "playback",
        reason: "UnknownError",
      }),
    );
  });

  it("does not leave an unhandled rejection behind", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    const { harness } = setup();
    refuse(harness, "NotAllowedError");

    act(() => harness.store.send({ type: "PLAY" }));
    await act(() => Promise.resolve());

    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});

describe("useAudioError — precedence", () => {
  it("reports the media error when both are set", async () => {
    const { result, harness } = setup();
    harness.element.play.mockReturnValue(
      Promise.reject(
        Object.assign(new Error("blocked"), { name: "NotAllowedError" }),
      ),
    );

    act(() => harness.store.send({ type: "PLAY" }));
    await waitFor(() => expect(result.current?.kind).toBe("playback"));

    act(() => {
      harness.element.error = mediaError(2);
      harness.element.emit("error");
    });

    expect(result.current).toEqual({ kind: "media", reason: "network" });
  });
});
