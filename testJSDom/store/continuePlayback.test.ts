import { describe, it, expect } from "vitest";
import { createTestStore, type TestStore } from "./createTestStore";
import type { MediaElementFake } from "./mediaElementFake";

/** Lets a `play()` promise settle and the store's handlers run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * The next `play()` as a real element runs it: `paused` drops at once, and the
 * promise stays pending until the test settles it.
 */
function pendingPlay(element: MediaElementFake) {
  let reject: (name: string) => void = () => {};
  element.play.mockImplementationOnce(() => {
    element.paused = false;
    return new Promise((_resolve, rejectPlay) => {
      reject = (name) => rejectPlay(new DOMException(name, name));
    });
  });
  return { reject: (name: string) => reject(name) };
}

/** A natural end: `pause` with `ended` already set, then `ended`. */
function endNaturally({ element }: TestStore) {
  element.paused = true;
  element.ended = true;
  element.emit("pause");
  element.emit("ended");
}

/**
 * F13. After a `src` swap the store plays the new track if playback was wanted
 * before it. The fake stands in for the element; what a browser would do around
 * it — `paused` flipping, the `play` and `pause` events — is staged by hand.
 */
describe("continuePlayback", () => {
  /** Playing as a real element would be after `play()` and its event. */
  function playing() {
    const harness = createTestStore({ readyState: 1 });
    harness.store.controls.play();
    harness.element.paused = false;
    harness.element.emit("play");
    harness.element.play.mockClear();
    return harness;
  }

  it("plays after a swap while playing", () => {
    const { store, element } = playing();
    // A swap pauses the element without a `pause` event.
    element.paused = true;

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(1);
  });

  it("stays paused when nothing was playing", () => {
    const { store, element } = createTestStore({ readyState: 1 });

    store.continuePlayback();

    expect(element.play).not.toHaveBeenCalled();
  });

  /**
   * The click that plays a track and selects it: the swap commits before the
   * `play` event arrives, so the intent has to come from the command.
   */
  it("plays when play() was sent just before the swap", () => {
    const { store, element } = createTestStore({ readyState: 1 });
    store.controls.play();
    element.play.mockClear();

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(1);
  });

  it("stays paused after pause() is sent", () => {
    const { store, element } = playing();
    store.controls.pause();
    element.paused = true;
    element.emit("pause");

    store.continuePlayback();

    expect(element.play).not.toHaveBeenCalled();
  });

  it("stays paused after a pause from outside the library", () => {
    const { store, element } = playing();
    element.paused = true;
    element.emit("pause");

    store.continuePlayback();

    expect(element.play).not.toHaveBeenCalled();
  });

  /** A playlist advanced from `onEnded`: the end paused it, the user did not. */
  it("plays after the track ended while playing", () => {
    const harness = playing();
    endNaturally(harness);

    harness.store.continuePlayback();

    expect(harness.element.play).toHaveBeenCalledTimes(1);
  });

  /** An `onEnded` that advances from an effect, or after a fetch. */
  it("plays when the swap comes tasks after the end", async () => {
    const harness = playing();
    endNaturally(harness);
    await settle();

    harness.store.continuePlayback();

    expect(harness.element.play).toHaveBeenCalledTimes(1);
  });

  /**
   * F14, as decided: a track that ran to its end counts as playing for every
   * later swap, until a pause — Previous after the last track plays. A click,
   * a key or a seek in between changes nothing.
   */
  it("plays on a swap long after the end, whatever happened in between", async () => {
    const harness = playing();
    endNaturally(harness);
    document.dispatchEvent(new Event("pointerdown"));
    harness.element.emit("seeking");
    await settle();

    harness.store.continuePlayback();

    expect(harness.element.play).toHaveBeenCalledTimes(1);
  });

  /** The way out, for a player that should stop at the end: `pause()`. */
  it("stays paused when a pause follows the end", () => {
    const harness = playing();
    endNaturally(harness);
    harness.store.controls.pause();

    harness.store.continuePlayback();

    expect(harness.element.play).not.toHaveBeenCalled();
  });

  /** B4: Firefox fires `ended` on a paused seek to the end, and no `pause`. */
  it("stays paused after Firefox's ended on a paused seek", () => {
    const { store, element } = createTestStore({ readyState: 1 });
    element.ended = true;
    element.emit("ended");

    store.continuePlayback();

    expect(element.play).not.toHaveBeenCalled();
  });

  it.each([
    ["paused", true, 1],
    ["playing", false, 0],
  ] as const)("follows TOGGLE_PLAY from %s", (_state, paused, plays) => {
    const { store, element } = createTestStore({ readyState: 1, paused });
    store.controls.toggle();
    element.play.mockClear();

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(plays);
  });

  /**
   * A click that plays and swaps: the swap pauses the element silently and
   * aborts the pending `play()`, which is no reason to stop.
   */
  it("plays when the swap aborted a pending play()", async () => {
    const { store, element } = createTestStore({ readyState: 1 });
    const play = pendingPlay(element);
    store.controls.play();
    element.paused = true;
    play.reject("AbortError");
    await settle();
    element.play.mockClear();

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(1);
    expect(store.playbackError.get()).toBeNull();
  });

  it("does not ask again after an autoplay refusal", async () => {
    const { store, element } = createTestStore({ readyState: 1 });
    const play = pendingPlay(element);
    store.controls.play();
    element.paused = true;
    play.reject("NotAllowedError");
    await settle();
    element.play.mockClear();

    store.continuePlayback();

    expect(element.play).not.toHaveBeenCalled();
  });

  /** F14. A broken track — a 404 — must not stop the playlist. */
  it("plays the next track after one that failed to load", async () => {
    const { store, element } = createTestStore({ readyState: 1 });
    const play = pendingPlay(element);
    store.controls.play();
    play.reject("NotSupportedError");
    await settle();
    element.play.mockClear();

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(1);
    expect(store.playbackError.get()).toBe("NotSupportedError");
  });

  /** A `pause` event that a later `play()` overtook says nothing about now. */
  it("ignores a pause event the element has since left", () => {
    const { store, element } = playing();
    element.emit("pause");

    store.continuePlayback();

    expect(element.play).toHaveBeenCalledTimes(1);
  });
});
